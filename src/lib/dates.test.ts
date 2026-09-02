import { afterEach, describe, expect, it, vi } from "vitest";
import { hoursUntilInTimeZone, wallClockDate } from "./dates";

describe("hoursUntilInTimeZone", () => {
  afterEach(() => vi.useRealTimers());

  function freezeAt(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it("cuenta las horas de pared entre 'ahora' en la zona y el startTime guardado", () => {
    // 16:00Z = 12:00 en Santiago (UTC-4, invierno).
    freezeAt("2026-09-01T16:00:00Z");
    // Cita mañana a las 15:00 hora de pared.
    const start = wallClockDate("2026-09-02", "15:00");
    expect(hoursUntilInTimeZone(start, "America/Santiago")).toBe(27);
  });

  it("una cita que ya pasó da un número negativo", () => {
    freezeAt("2026-09-01T16:00:00Z"); // 12:00 Santiago
    const start = wallClockDate("2026-09-01", "09:00");
    expect(hoursUntilInTimeZone(start, "America/Santiago")).toBe(-3);
  });

  it("no depende de la zona del servidor: el mismo instante real da lo mismo en dos zonas de negocio distintas sólo por su offset", () => {
    freezeAt("2026-09-01T16:00:00Z");
    const start = wallClockDate("2026-09-01", "18:00"); // 18:00 hora de pared

    // En Santiago (12:00 ahora) faltan 6 h de pared para las 18:00.
    expect(hoursUntilInTimeZone(start, "America/Santiago")).toBe(6);
    // En Ciudad de México (10:00 ahora, UTC-6) faltan 8 h de pared.
    expect(hoursUntilInTimeZone(start, "America/Mexico_City")).toBe(8);
  });

  it("cae dentro de la ventana [2, 26] del cron para una cita ~12 h después", () => {
    freezeAt("2026-09-01T16:00:00Z"); // 12:00 Santiago
    const start = wallClockDate("2026-09-02", "00:00"); // medianoche, 12 h de pared
    const h = hoursUntilInTimeZone(start, "America/Santiago");
    expect(h).toBe(12);
    expect(h >= 2 && h <= 26).toBe(true);
  });
});
