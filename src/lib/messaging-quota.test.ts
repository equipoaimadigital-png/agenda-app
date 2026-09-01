import { describe, expect, it } from "vitest";
import { monthWindowUTC, quotaStatus } from "./messaging-quota";
import { MONTHLY_MESSAGE_QUOTA } from "./subscription";

describe("monthWindowUTC", () => {
  it("devuelve [1 del mes, 1 del mes siguiente) en UTC", () => {
    const { start, end } = monthWindowUTC(new Date("2026-03-17T09:30:00Z"));
    expect(start.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("cruza el fin de año", () => {
    const { start, end } = monthWindowUTC(new Date("2026-12-31T23:59:59Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("el primer instante del mes ya cae en ese mes", () => {
    const { start } = monthWindowUTC(new Date("2026-06-01T00:00:00Z"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("quotaStatus", () => {
  it("bajo el tope: no está ni cerca ni pasado", () => {
    const s = quotaStatus(100, 1000);
    expect(s).toMatchObject({ used: 100, limit: 1000, remaining: 900, overLimit: false, nearLimit: false });
  });

  it("al 90% marca nearLimit pero todavía deja pasar", () => {
    const s = quotaStatus(900, 1000);
    expect(s.nearLimit).toBe(true);
    expect(s.overLimit).toBe(false);
  });

  it("en el tope exacto ya está pasado (no quedan mensajes)", () => {
    const s = quotaStatus(1000, 1000);
    expect(s.overLimit).toBe(true);
    expect(s.remaining).toBe(0);
  });

  it("por encima del tope no devuelve remaining negativo", () => {
    const s = quotaStatus(1500, 1000);
    expect(s.remaining).toBe(0);
    expect(s.overLimit).toBe(true);
  });

  it("un conteo negativo raro se trata como 0", () => {
    const s = quotaStatus(-5, 1000);
    expect(s.used).toBe(0);
    expect(s.remaining).toBe(1000);
  });

  it("usa MONTHLY_MESSAGE_QUOTA como límite por defecto", () => {
    expect(quotaStatus(0).limit).toBe(MONTHLY_MESSAGE_QUOTA);
  });
});
