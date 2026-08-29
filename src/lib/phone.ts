/**
 * Los teléfonos en la base vienen en formatos mixtos ("+56978037712",
 * "987446788", "+56 9 7803 7712", "9-8744-6788") porque nunca se validó un
 * formato único al capturarlos. Twilio exige E.164 (+<código país><número>):
 * si ya viene con "+" se respeta tal cual (limpiando separadores); si no, se
 * asume móvil chileno.
 */
export function toE164(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // Sin "+": si ya trae el prefijo país "56" al inicio, no lo dupliques.
  const digits = cleaned.replace(/^56/, "");
  return `+56${digits}`;
}

/** Destinatario para la API de WhatsApp de Twilio ("whatsapp:+56..."). */
export function whatsappTo(phone: string): string {
  return `whatsapp:${toE164(phone)}`;
}
