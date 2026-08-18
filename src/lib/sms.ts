import twilio from "twilio";
import { formatDateLong, wallClockOf } from "@/lib/dates";

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
  return `${formatDateLong(dateStr)} a las ${time}`;
}

/**
 * Los teléfonos en la base vienen en formatos mixtos ("+56978037712",
 * "987446788") porque nunca se validó un formato único al capturarlos.
 * Twilio exige E.164 (+<código país><número>) — si ya viene con "+" se
 * respeta tal cual; si no, se asume móvil chileno (9 dígitos, sin el "56").
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  return `+56${digits}`;
}

type ReminderSmsInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
};

/** false si Twilio no está configurado todavía, o si el envío falla — nunca lanza. */
export async function sendReminderSms(info: ReminderSmsInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  if (!client || !from) return false;

  const when = whenText(info.startTime);

  try {
    await client.messages.create({
      to: toE164(info.clientPhone),
      from,
      body: `Hola ${info.clientName}, te recordamos tu cita de ${info.serviceName} con ${info.businessName} el ${when}. — Tu Hora Lista`,
    });
    return true;
  } catch (err) {
    console.error("Error enviando SMS de recordatorio:", err);
    return false;
  }
}
