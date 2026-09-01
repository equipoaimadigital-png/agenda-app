import { sendConfirmationWhatsApp, sendReminderWhatsApp } from "@/lib/whatsapp";
import { sendConfirmationSms, sendReminderSms } from "@/lib/sms";

export type ClientPhoneInfo = {
  professionalId: string;
  businessName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  manageToken?: string;
};

export type PhoneChannel = "whatsapp" | "sms" | "none";

/**
 * Aviso al teléfono del cliente: **WhatsApp primero, SMS solo si WhatsApp no
 * sale**. Nunca los dos — así el costo de Twilio baja casi a la mitad.
 *
 * `sendConfirmationWhatsApp` devuelve false (y entonces se cae a SMS) cuando:
 * WhatsApp no está configurado / la plantilla no está aprobada, la cuenta
 * llegó al tope mensual, o Twilio rechazó el envío.
 */
export async function notifyClientPhoneConfirmation(info: ClientPhoneInfo): Promise<PhoneChannel> {
  if (await sendConfirmationWhatsApp(info)) return "whatsapp";
  if (await sendConfirmationSms(info)) return "sms";
  return "none";
}

export async function notifyClientPhoneReminder(info: ClientPhoneInfo): Promise<PhoneChannel> {
  if (await sendReminderWhatsApp(info)) return "whatsapp";
  if (await sendReminderSms(info)) return "sms";
  return "none";
}
