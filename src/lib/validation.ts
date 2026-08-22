/**
 * Validación práctica de email (no la gramática completa de RFC 5321, que
 * acepta casos que ningún proveedor real usa) — rechaza espacios, saltos de
 * línea y estructura inválida antes de que el valor llegue a un header de
 * email o a la base de datos.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254; // límite práctico de RFC 5321 (path length)

export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false;
  if (/[\r\n]/.test(email)) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Recorta y limpia una respuesta de campo personalizado antes de guardarla.
 * No HTML-encodea: React ya escapa texto interpolado en JSX (ver BookingRow),
 * así que encodear acá corrompía visualmente el texto (mostraba "&amp;"
 * literal en vez de "&"). El límite de largo es la única protección que
 * corresponde en este punto — la protección contra HTML crudo va donde el
 * dato se inserta en un contexto que sí lo interpreta (emails, ver email.ts).
 */
export function sanitizeCustomAnswer(text: string): string {
  if (!text) return "";
  return text.replace(/[\r\n]+/g, " ").trim().slice(0, 500);
}
