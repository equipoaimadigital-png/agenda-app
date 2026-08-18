import { describe, expect, it } from "vitest";
import { toE164 } from "./sms";

describe("toE164", () => {
  it("respeta un número que ya viene con +", () => {
    expect(toE164("+56978037712")).toBe("+56978037712");
  });

  it("le agrega +56 a un móvil chileno sin código de país", () => {
    expect(toE164("987446788")).toBe("+56987446788");
    expect(toE164("939651225")).toBe("+56939651225");
  });

  it("limpia espacios y guiones antes de normalizar", () => {
    expect(toE164("+56 9 7803 7712")).toBe("+56978037712");
    expect(toE164("9-8744-6788")).toBe("+56987446788");
  });
});
