"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CampaignAudience } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { sendCampaignEmails } from "@/lib/email";
import { campaignBranding } from "@/lib/campaign-branding";
import { getPlaybooks, type PlaybookId } from "@/lib/playbooks";

const VALID_IDS: PlaybookId[] = [
  "primeras_visitas",
  "habituales_enfriados",
  "dia_flojo",
  "cumpleanos_mes",
];

/**
 * Envía la campaña de un playbook. La audiencia se RECALCULA en el servidor
 * a partir del `playbookId` — el navegador solo manda qué receta y el texto.
 */
export async function sendPlaybookCampaign(
  formData: FormData
): Promise<{ error?: string; sent?: number }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const playbookId = String(formData.get("playbookId") || "") as PlaybookId;
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!VALID_IDS.includes(playbookId)) return { error: "Sugerencia no válida." };
  if (!subject || !body) return { error: "Completa el asunto y el mensaje." };

  const playbooks = await getPlaybooks(professional.id);
  const pb = playbooks.find((p) => p.id === playbookId);
  if (!pb || pb.targets.length === 0) {
    return { error: "Esta sugerencia ya no aplica (los datos cambiaron). Recarga la página." };
  }

  const rows = await Promise.all(
    pb.targets.map((t) =>
      prisma.client.upsert({
        where: { professionalId_phone: { professionalId: professional.id, phone: t.phone } },
        create: {
          professionalId: professional.id,
          phone: t.phone,
          name: t.name || null,
          email: t.email,
        },
        update: {},
      })
    )
  );
  const tokenByPhone = new Map(rows.map((c) => [c.phone, c.unsubscribeToken]));

  const { sent } = await sendCampaignEmails({
    branding: campaignBranding(professional, true),
    subject,
    body,
    recipients: pb.targets.map((t) => ({
      email: t.email,
      unsubscribeToken: tokenByPhone.get(t.phone)!,
      name: t.name,
    })),
  });

  await prisma.emailCampaign.create({
    data: {
      professionalId: professional.id,
      subject,
      body,
      audience: CampaignAudience.CUSTOM,
      recipientCount: sent,
    },
  });
  if (sent > 0) {
    await prisma.client.updateMany({
      where: { id: { in: rows.map((c) => c.id) } },
      data: { lastCampaignAt: new Date() },
    });
  }

  revalidatePath("/dashboard/campanas");
  revalidatePath("/dashboard/reactivacion");
  revalidatePath("/dashboard");
  return { sent };
}
