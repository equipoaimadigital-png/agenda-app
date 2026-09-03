import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

// Llave de prueba (32 bytes en hex).
const TEST_KEY = "0".repeat(64);

describe("crypto — cifrado de secretos", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("cifra y descifra ida y vuelta", () => {
    const secret = "APP_USR-1234567890abcdef-mp-access-token";
    const enc = encryptSecret(secret);
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("dos cifrados del mismo texto son distintos (IV aleatorio)", () => {
    expect(encryptSecret("hola")).not.toBe(encryptSecret("hola"));
  });

  it("un valor sin prefijo se devuelve tal cual (compat. hacia atrás)", () => {
    expect(decryptSecret("token-viejo-sin-cifrar")).toBe("token-viejo-sin-cifrar");
  });

  it("detecta manipulación: cambiar un byte del ciphertext hace fallar el descifrado", () => {
    const enc = encryptSecret("dato sensible");
    const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "B" : "A") + enc.slice(-1);
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("sin ENCRYPTION_KEY, encryptSecret devuelve el texto plano (no rompe en dev)", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(encryptSecret("x")).toBe("x");
  });
});
