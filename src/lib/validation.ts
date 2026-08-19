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

export function sanitizeCustomAnswer(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .slice(0, 500); // limita a 500 chars
}
