import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado simétrico para secretos guardados en la base (tokens de Mercado
 * Pago Connect de cada profesional). AES-256-GCM: confidencialidad + tag de
 * integridad. La llave viene de ENCRYPTION_KEY (32 bytes en hex o base64).
 *
 * Si un valor guardado NO tiene el prefijo `enc:v1:`, se asume texto plano
 * viejo (guardado antes de este cambio) y se devuelve tal cual — así la
 * migración es transparente: el token se re-cifra la próxima vez que el
 * profesional reconecta su cuenta.
 */

const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";

function loadKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  const buf =
    raw.length === 64 ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  if (!key) {
    // En dev sin llave se guarda sin cifrar para no bloquear el flujo; en
    // producción ENCRYPTION_KEY debe estar (ver .env.example).
    console.warn("[crypto] ENCRYPTION_KEY ausente — el secreto se guarda SIN cifrar.");
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value; // texto plano legado
  const key = loadKey();
  if (!key) {
    throw new Error("ENCRYPTION_KEY ausente: no se puede descifrar un token guardado.");
  }
  const raw = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
