import { beforeEach, describe, expect, it, vi } from "vitest";
import { MONTHLY_MESSAGE_QUOTA, TRIAL_MESSAGE_QUOTA } from "./subscription";

const findUniqueMock = vi.fn();
const countMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    professional: { findUnique: (...args: unknown[]) => findUniqueMock(...args) },
    messageLog: { count: (...args: unknown[]) => countMock(...args) },
  },
}));

const { monthWindowUTC, quotaStatus, messagingQuota, canSendPaidMessage } = await import(
  "./messaging-quota"
);

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

describe("tope según el estado de la cuenta", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    countMock.mockReset();
    countMock.mockResolvedValue(0);
  });

  it("una cuenta en prueba gratis (sin pago manual vigente) usa el tope reducido", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "TRIAL",
      billingExempt: false,
      subscriptionPaidUntil: null,
    });
    expect((await messagingQuota("p1")).limit).toBe(TRIAL_MESSAGE_QUOTA);
  });

  it("una cuenta con plan pagado (ACTIVE) usa el tope de pago", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "ACTIVE",
      billingExempt: false,
      subscriptionPaidUntil: null,
    });
    expect((await messagingQuota("p1")).limit).toBe(MONTHLY_MESSAGE_QUOTA);
  });

  it("una cuenta en trial que YA pagó manualmente usa el tope de pago, no el de prueba", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "TRIAL",
      billingExempt: false,
      subscriptionPaidUntil: new Date(Date.now() + 10 * 24 * 3600_000),
    });
    expect((await messagingQuota("p1")).limit).toBe(MONTHLY_MESSAGE_QUOTA);
  });

  it("una cuenta exenta de cobro nunca usa el tope de prueba", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "TRIAL",
      billingExempt: true,
      subscriptionPaidUntil: null,
    });
    expect((await messagingQuota("p1")).limit).toBe(MONTHLY_MESSAGE_QUOTA);
  });

  it("canSendPaidMessage bloquea al llegar al tope de prueba aunque falte mucho para el de pago", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionStatus: "TRIAL",
      billingExempt: false,
      subscriptionPaidUntil: null,
    });
    countMock.mockResolvedValue(TRIAL_MESSAGE_QUOTA);
    expect(await canSendPaidMessage("p1")).toBe(false);
  });
});
