"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CampaignAudience, type Professional } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { sendCampaignEmails, sendTestCampaignEmail, type CampaignBranding } from "@/lib/email";
import { buildWhatsappLink } from "@/lib/whatsapp";

type Recipient = { phone: string; email: string; name: string };

/**
 * Identidad de marca del negocio para el correo de campaña: sale toda de la
 * fila del profesional (portada + color + redes), nada nuevo que pedirle.
 */
function campaignBranding(professional: Professional, includeCover: boolean): CampaignBranding {
  return {
    businessName: professional.businessName,
    tagline: professional.description,
    brandColor: professional.brandColor,
    coverImageUrl: professional.coverImageUrl,
    includeCover,
    bookingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/reservar/${professional.slug}`,
    instagramUrl: professional.instagramUrl,
    facebookUrl: professional.facebookUrl,
    whatsappUrl: professional.phone
      ? buildWhatsappLink(
          professional.phone,
          `Hola, quiero reservar una hora en ${professional.businessName}.`
        )
      : null,
    mapsUrl: professional.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.address)}`
      : null,
  };
}

/** Lee el interruptor "Incluir mi imagen de portada" del formulario (por defecto sí). */
function readIncludeCover(formData: FormData): boolean {
  return String(formData.get("includeCover") || "true") !== "false";
}

/** Un cliente por teléfono (el email y nombre más reciente que dejó), con su última visita. */
async function getRecipients(
  professionalId: string,
  audience: CampaignAudience,
  customPhones?: string[]
): Promise<Recipient[]> {
  const bookings = await prisma.booking.findMany({
    where: { professionalId },
    orderBy: { startTime: "desc" },
    select: { clientPhone: true, clientEmail: true, clientName: true, startTime: true },
  });

  const byPhone = new Map<string, { email: string; name: string; lastVisit: Date }>();
  for (const b of bookings) {
    if (!b.clientEmail) continue;
    // `bookings` ya viene ordenado desc, así que el primer encuentro por
    // teléfono es siempre la visita más reciente.
    if (!byPhone.has(b.clientPhone)) {
      byPhone.set(b.clientPhone, { email: b.clientEmail, name: b.clientName, lastVisit: b.startTime });
    }
  }

  let candidates = [...byPhone.entries()];
  if (audience === "INACTIVE_30D") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    candidates = candidates.filter(([, v]) => v.lastVisit < cutoff);
  }
  if (audience === "CUSTOM") {
    const selected = new Set(customPhones ?? []);
    candidates = candidates.filter(([phone]) => selected.has(phone));
  }
  if (candidates.length === 0) return [];

  const phones = candidates.map(([phone]) => phone);
  const unsubscribed = await prisma.client.findMany({
    where: { professionalId, phone: { in: phones }, unsubscribed: true },
    select: { phone: true },
  });
  const unsubscribedSet = new Set(unsubscribed.map((c) => c.phone));

  return candidates
    .filter(([phone]) => !unsubscribedSet.has(phone))
    .map(([phone, v]) => ({ phone, email: v.email, name: v.name }));
}

/** Para mostrar "esto le va a llegar a N personas" antes de enviar. */
export async function getAudienceCount(
  audience: CampaignAudience,
  customPhones?: string[]
): Promise<number> {
  const professional = await getCurrentProfessional();
  if (!professional) return 0;
  const recipients = await getRecipients(professional.id, audience, customPhones);
  return recipients.length;
}

/** Lista de clientes con email (y no desuscritos) para el selector de "Clientes específicos". */
export async function listClientsForCampaign(): Promise<
  { phone: string; name: string; email: string }[]
> {
  const professional = await getCurrentProfessional();
  if (!professional) return [];

  const all = await getRecipients(professional.id, "ALL");
  return all.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function createAndSendCampaign(
  formData: FormData
): Promise<{ error?: string; sent?: number }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audienceRaw = String(formData.get("audience") || "ALL");

  if (!subject || !body) return { error: "Completa el asunto y el mensaje." };
  if (audienceRaw !== "ALL" && audienceRaw !== "INACTIVE_30D" && audienceRaw !== "CUSTOM") {
    return { error: "Audiencia inválida." };
  }
  const audience = audienceRaw as CampaignAudience;

  let customPhones: string[] | undefined;
  if (audience === "CUSTOM") {
    try {
      const parsed: unknown = JSON.parse(String(formData.get("customPhones") || "[]"));
      customPhones = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
    } catch {
      customPhones = [];
    }
    if (customPhones.length === 0) {
      return { error: "Elige al menos un cliente." };
    }
  }

  const recipients = await getRecipients(professional.id, audience, customPhones);
  if (recipients.length === 0) {
    return { error: "No hay destinatarios para esta audiencia (o todos se desuscribieron)." };
  }

  // Cada destinatario necesita un Client con su token de desuscripción —
  // upsert por si todavía no existía (ej. nunca le pusimos un cumpleaños).
  const clients = await Promise.all(
    recipients.map((r) =>
      prisma.client.upsert({
        where: { professionalId_phone: { professionalId: professional.id, phone: r.phone } },
        create: { professionalId: professional.id, phone: r.phone },
        update: {},
      })
    )
  );
  const tokenByPhone = new Map(clients.map((c) => [c.phone, c.unsubscribeToken]));

  const { sent } = await sendCampaignEmails({
    branding: campaignBranding(professional, readIncludeCover(formData)),
    subject,
    body,
    recipients: recipients.map((r) => ({
      email: r.email,
      unsubscribeToken: tokenByPhone.get(r.phone)!,
      name: r.name,
    })),
  });

  await prisma.emailCampaign.create({
    data: {
      professionalId: professional.id,
      subject,
      body,
      audience,
      recipientCount: sent,
    },
  });

  revalidatePath("/dashboard/campanas");
  return { sent };
}

/** Manda la campaña en curso solo al propio correo del profesional, para revisar antes de enviarla de verdad. */
export async function sendTestCampaign(formData: FormData): Promise<{ error?: string; sent?: boolean }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) return { error: "Completa el asunto y el mensaje." };

  const sent = await sendTestCampaignEmail({
    branding: campaignBranding(professional, readIncludeCover(formData)),
    toEmail: professional.email,
    subject,
    body,
  });

  return sent ? { sent: true } : { error: "No se pudo enviar la prueba. Intenta de nuevo." };
}

/** Borra una campaña del historial (no reenvía ni afecta a los destinatarios ya contactados). */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  await prisma.emailCampaign.deleteMany({
    where: { id: campaignId, professionalId: professional.id },
  });

  revalidatePath("/dashboard/campanas");
}

/** Desuscribe a un cliente vía su link de un clic — sin login. */
export async function unsubscribeByToken(
  token: string
): Promise<{ businessName?: string; error?: string }> {
  const client = await prisma.client.findUnique({ where: { unsubscribeToken: token } });
  if (!client) return { error: "Este link no es válido." };

  await prisma.client.update({ where: { id: client.id }, data: { unsubscribed: true } });

  const professional = await prisma.professional.findUnique({
    where: { id: client.professionalId },
    select: { businessName: true },
  });
  return { businessName: professional?.businessName };
}
