import twilio from "twilio";
import { formatDateLong, wallClockOf } from "@/lib/dates";

export function buildWhatsappLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

function getClient(): ReturnType<typeof twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function fromNumber(): string | null {
  return process.env.TWILIO_PHONE_NUMBER || null;
}

type ReminderWhatsAppInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  manageToken?: string; // opcional para recordatorios
};

/**
 * Envía WhatsApp de CONFIRMACIÓN cuando se crea la reserva.
 * No usa plantilla — es un mensaje freeform directo.
 * Nunca lanza excepciones — siempre devuelve boolean.
 */
export async function sendConfirmationWhatsApp(info: ReminderWhatsAppInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();

  if (!client || !from) return false;

  const { dateStr, time } = wallClockOf(info.startTime);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuhoralista.app";
  const manageLink = info.manageToken ? `${siteUrl}/reserva/${info.manageToken}` : "";
  const linkText = manageLink ? `\n\n🔗 *Gestiona tu cita:*\n${manageLink}` : "\n\nSi necesitas cancelar o reprogramar, puedes hacerlo desde tu enlace de gestión de cita.";
  const message = `✅ *Reserva confirmada*\n\n${info.clientName}, tu cita está confirmada:\n\n📅 ${formatDateLong(dateStr)}\n⏰ ${time}\n💼 ${info.serviceName}\n🏢 ${info.businessName}${linkText}`;

  try {
    await client.messages.create({
      to: `whatsapp:+56${info.clientPhone.replace(/^(\+56)?/, "")}`,
      from: `whatsapp:${from}`,
      body: message,
    });
    return true;
  } catch (err) {
    console.error("Error enviando WhatsApp de confirmación:", err);
    return false;
  }
}

/**
 * Envía recordatorio por WhatsApp usando la plantilla aprobada por Meta.
 * Devuelve false si:
 * - Twilio no está configurado
 * - El TEMPLATE_SID no está definido (plantilla aún no aprobada por Meta)
 * - El envío falla
 *
 * Nunca lanza excepciones — siempre devuelve boolean.
 */
export async function sendReminderWhatsApp(info: ReminderWhatsAppInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  // Si no está configurado el template, aún no está aprobado por Meta
  if (!client || !from || !templateSid) return false;

  const { dateStr, time } = wallClockOf(info.startTime);
  const daysUntil = Math.floor((info.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dayText = daysUntil === 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;

  try {
    await client.messages.create({
      to: `whatsapp:+56${info.clientPhone.replace(/^(\+56)?/, "")}`,
      from: `whatsapp:${from}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify([
        info.clientName,
        info.serviceName,
        info.businessName,
        `${dayText}, ${formatDateLong(dateStr)} a las ${time}`,
      ]),
    });
    return true;
  } catch (err) {
    console.error("Error enviando WhatsApp de recordatorio:", err);
    return false;
  }
}
