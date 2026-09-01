import twilio from "twilio";
import { formatDateLong, wallClockOf } from "@/lib/dates";
import { whatsappTo } from "@/lib/phone";
import { canSendPaidMessage, recordPaidMessage } from "@/lib/messaging-quota";

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

type WhatsAppInfo = {
  professionalId: string;
  businessName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  manageToken?: string; // opcional para recordatorios
};

/** Cuarta variable de las plantillas: "mañana, viernes 7 de agosto a las 15:00". */
function whenVariable(startTime: Date): string {
  const { dateStr, time } = wallClockOf(startTime);
  const daysUntil = Math.floor((startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dayText = daysUntil <= 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
  return `${dayText}, ${formatDateLong(dateStr)} a las ${time}`;
}

// La Content API de Twilio espera un OBJETO {"1": "...", "2": "..."} — no un
// array. El ORDEN debe calzar con las plantillas aprobadas en Twilio
// (appointment_reminder_v3 y la de confirmación), que definen:
//   {{1}} nombre del cliente · {{2}} nombre del negocio ·
//   {{3}} nombre del servicio · {{4}} cuándo.
function templateVariables(info: WhatsAppInfo): string {
  return JSON.stringify({
    1: info.clientName,
    2: info.businessName,
    3: info.serviceName,
    4: whenVariable(info.startTime),
  });
}

/**
 * WhatsApp de CONFIRMACIÓN al crear la reserva.
 *
 * OJO: WhatsApp/Meta NO permiten mensajes freeform iniciados por el negocio
 * fuera de la ventana de 24 h que abre el cliente al escribir primero (Twilio
 * error 63016). Un cliente que reserva por primera vez no tiene esa ventana
 * abierta, así que la confirmación DEBE ir por plantilla aprobada. Sin
 * plantilla de confirmación configurada se omite el canal (email y SMS ya
 * confirman) — nunca se intenta un freeform que Twilio va a rechazar.
 *
 * Nunca lanza — siempre devuelve boolean.
 */
export async function sendConfirmationWhatsApp(info: WhatsAppInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  const templateSid = process.env.TWILIO_WHATSAPP_CONFIRM_TEMPLATE_SID;

  if (!client || !from || !templateSid) {
    if (client && from && !templateSid) {
      console.warn(
        "WhatsApp de confirmación omitido: falta TWILIO_WHATSAPP_CONFIRM_TEMPLATE_SID (plantilla de confirmación aprobada por Meta)."
      );
    }
    return false;
  }
  if (!(await canSendPaidMessage(info.professionalId))) {
    console.warn(`[whatsapp] tope mensual alcanzado, se omite confirmación (${info.professionalId})`);
    return false;
  }

  try {
    await client.messages.create({
      to: whatsappTo(info.clientPhone),
      from: `whatsapp:${from}`,
      contentSid: templateSid,
      contentVariables: templateVariables(info),
    });
    await recordPaidMessage(info.professionalId, "WHATSAPP");
    return true;
  } catch (err) {
    console.error("Error enviando WhatsApp de confirmación:", err);
    return false;
  }
}

/**
 * Recordatorio por WhatsApp usando la plantilla aprobada por Meta.
 * false si Twilio no está configurado, si falta el TEMPLATE_SID, o si el
 * envío falla. Nunca lanza.
 */
export async function sendReminderWhatsApp(info: WhatsAppInfo): Promise<boolean> {
  const client = getClient();
  const from = fromNumber();
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  if (!client || !from || !templateSid) return false;
  if (!(await canSendPaidMessage(info.professionalId))) {
    console.warn(`[whatsapp] tope mensual alcanzado, se omite recordatorio (${info.professionalId})`);
    return false;
  }

  try {
    await client.messages.create({
      to: whatsappTo(info.clientPhone),
      from: `whatsapp:${from}`,
      contentSid: templateSid,
      contentVariables: templateVariables(info),
    });
    await recordPaidMessage(info.professionalId, "WHATSAPP");
    return true;
  } catch (err) {
    console.error("Error enviando WhatsApp de recordatorio:", err);
    return false;
  }
}
