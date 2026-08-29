import { describe, expect, it } from "vitest";
import { toE164, whatsappTo } from "./phone";

describe("toE164", () => {
  it("respeta un número que ya viene con +", () => {
    expect(toE164("+56978037712")).toBe("+56978037712");
  });

  it("le agrega +56 a un móvil chileno sin código de país", () => {
    expect(toE164("987446788")).toBe("+56987446788");
  });

  it("no duplica el prefijo país cuando viene '56' sin '+'", () => {
    expect(toE164("56978037712")).toBe("+56978037712");
    expect(toE164("56 9 8744 6788")).toBe("+56987446788");
  });

  it("limpia espacios y guiones antes de normalizar", () => {
    expect(toE164("+56 9 7803 7712")).toBe("+56978037712");
    expect(toE164("9-8744-6788")).toBe("+56987446788");
  });
});

describe("whatsappTo", () => {
  it("antepone el prefijo 'whatsapp:' al E.164", () => {
    expect(whatsappTo("978037712")).toBe("whatsapp:+56978037712");
    expect(whatsappTo("56978037712")).toBe("whatsapp:+56978037712");
    expect(whatsappTo("+56 9 7803 7712")).toBe("whatsapp:+56978037712");
  });
});
