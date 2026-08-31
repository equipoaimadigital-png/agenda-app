"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CampaignAudience } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { sendCampaignEmails } from "@/lib/email";
import { campaignBranding } from "@/lib/campaign-branding";
import { getReactivationData } from "@/lib/reactivation";

/**
 * Envía una campaña de reactivación a los clientes atrasados. La lista se
 * RECALCULA en el servidor — nunca se confía en un listado que venga del
 * navegador. Reutiliza el mismo correo con marca que las campañas normales.
 */
export async function sendReactivationCampaign(
  formData: FormData
): Promise<{ error?: string; sent?: number }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const scope = String(formData.get("scope") || "overdue");
  if (!subject || !body) return { error: "Completa el asunto y el mensaje." };

  const data = await getReactivationData(professional.id);
  if (!data.ready) {
    return { error: "Todavía no hay suficiente historial para esta acción." };
  }

  const pool = scope === "overdue_soon" ? [...data.overdue, ...data.soon] : data.overdue;
  const targets = pool.filter((c) => c.email);
  if (targets.length === 0) {
    return { error: "Ninguno de estos clientes tiene email cargado para poder escribirle." };
  }

  const rows = await Promise.all(
    targets.map((t) =>
      prisma.client.upsert({
        where: { professionalId_phone: { professionalId: professional.id, phone: t.phone } },
        create: { professionalId: professional.id, phone: t.phone, name: t.name, email: t.email },
        update: {},
      })
    )
  );
  const tokenByPhone = new Map(rows.map((c) => [c.phone, c.unsubscribeToken]));

  const { sent } = await sendCampaignEmails({
    branding: campaignBranding(professional, true),
    subject,
    body,
    recipients: targets.map((t) => ({
      email: t.email as string,
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

  revalidatePath("/dashboard/reactivacion");
  revalidatePath("/dashboard/campanas");
  revalidatePath("/dashboard");
  return { sent };
}
