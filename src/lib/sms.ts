import twilio from "twilio";
import { formatDateLong, wallClockOf } from "@/lib/dates";
import { toE164 } from "@/lib/phone";

// Se re-exporta para no romper imports existentes (`@/lib/sms`).
export { toE164 } from "@/lib/phone";

function getClient(): ReturnType<typeof twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function fromNumber(): string | null {
  return process.env.TWILIO_PHONE_NUMBER || null;
}

function whenText(startTime: Date): string {
  const { dateStr, time } = wallClockOf(startTime);
  const daysUntil = Math.floor((startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dayText = daysUntil === 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
  return `${dayText}, ${formatDateLong(dateStr)} a las ${time}`;
}

type ReminderSmsInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  manageToken?: string; // opcional para recordatorios
};

/** false si Twilio no está configurado todavía, o si el envío falla — nunca lanza. */
export async function sendConfirmationSms(info: ReminderSmsInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  if (!client || !from) return false;

  const when = whenText(info.startTime);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuhoralista.com";
  const manageLink = info.manageToken ? `${siteUrl}/reserva/${info.manageToken}` : "";
  const linkText = manageLink ? ` Gestiona tu cita: ${manageLink}` : " Puedes cancelar o reprogramar en tu enlace.";

  try {
    await client.messages.create({
      to: toE164(info.clientPhone),
      from,
      body: `✓ Cita confirmada con ${info.businessName}. ${info.serviceName} ${when}.${linkText} — Tu Hora Lista`,
    });
    return true;
  } catch (err) {
    console.error("Error enviando SMS de confirmación:", err);
    return false;
  }
}

export async function sendReminderSms(info: ReminderSmsInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  if (!client || !from) return false;

  const when = whenText(info.startTime);

  try {
    await client.messages.create({
      to: toE164(info.clientPhone),
      from,
      body: `Recordatorio: tu cita de ${info.serviceName} con ${info.businessName} es ${when}. — Tu Hora Lista`,
    });
    return true;
  } catch (err) {
    console.error("Error enviando SMS de recordatorio:", err);
    return false;
  }
}
