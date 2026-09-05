import { describe, expect, it } from "vitest";
import {
  ANNUAL_LIST_PRICE_CLP,
  ANNUAL_SAVINGS_CLP,
  hasDashboardAccess,
  pastDueGraceDaysLeft,
  PAST_DUE_GRACE_DAYS,
  SUBSCRIPTION_PRICE_ANNUAL_CLP,
  SUBSCRIPTION_PRICE_CLP,
} from "./subscription";

describe("precios del plan anual", () => {
  it("el precio de lista es 12 meses al valor mensual", () => {
    expect(ANNUAL_LIST_PRICE_CLP).toBe(SUBSCRIPTION_PRICE_CLP * 12);
  });

  it("el plan anual cobra 10 meses (2 gratis)", () => {
    expect(SUBSCRIPTION_PRICE_ANNUAL_CLP).toBe(SUBSCRIPTION_PRICE_CLP * 10);
  });

  it("el ahorro es la diferencia entre lista y precio anual, y es positivo", () => {
    expect(ANNUAL_SAVINGS_CLP).toBe(ANNUAL_LIST_PRICE_CLP - SUBSCRIPTION_PRICE_ANNUAL_CLP);
    expect(ANNUAL_SAVINGS_CLP).toBeGreaterThan(0);
  });
});

const future = new Date(Date.now() + 5 * 86400000);
const past = new Date(Date.now() - 5 * 86400000);
const base = { billingExempt: false, pastDueSince: null } as const;

describe("hasDashboardAccess", () => {
  it("cuenta exenta de cobro tiene acceso aunque todo lo demás esté vencido", () => {
    expect(
      hasDashboardAccess({
        billingExempt: true,
        subscriptionStatus: "CANCELLED",
        trialEndsAt: past,
        subscriptionPaidUntil: past,
        pastDueSince: past,
      })
    ).toBe(true);
  });

  it("ACTIVE (cobro automático) siempre tiene acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "ACTIVE",
        trialEndsAt: past,
        subscriptionPaidUntil: past,
      })
    ).toBe(true);
  });

  it("pago manual vigente da acceso aunque el status no sea ACTIVE", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: past,
        subscriptionPaidUntil: future,
      })
    ).toBe(true);
  });

  it("pago manual vencido no da acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: past,
        subscriptionPaidUntil: past,
      })
    ).toBe(false);
  });

  it("PAST_DUE reciente da acceso durante el período de gracia", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: past,
        subscriptionPaidUntil: null,
        pastDueSince: new Date(Date.now() - 2 * 86400000), // hace 2 días, gracia = 7
      })
    ).toBe(true);
  });

  it("PAST_DUE con la gracia ya vencida no da acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "PAST_DUE",
        trialEndsAt: past,
        subscriptionPaidUntil: null,
        pastDueSince: new Date(Date.now() - (PAST_DUE_GRACE_DAYS + 1) * 86400000),
      })
    ).toBe(false);
  });

  it("prueba gratis vigente da acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "TRIAL",
        trialEndsAt: future,
        subscriptionPaidUntil: null,
      })
    ).toBe(true);
  });

  it("prueba gratis terminada y sin pago no da acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "TRIAL",
        trialEndsAt: past,
        subscriptionPaidUntil: null,
      })
    ).toBe(false);
  });

  it("CANCELLED sin pago manual no da acceso", () => {
    expect(
      hasDashboardAccess({
        ...base,
        subscriptionStatus: "CANCELLED",
        trialEndsAt: null,
        subscriptionPaidUntil: null,
      })
    ).toBe(false);
  });
});

describe("pastDueGraceDaysLeft", () => {
  it("null si no está en PAST_DUE", () => {
    expect(pastDueGraceDaysLeft({ subscriptionStatus: "ACTIVE", pastDueSince: past })).toBeNull();
  });

  it("null si está en PAST_DUE pero sin fecha", () => {
    expect(pastDueGraceDaysLeft({ subscriptionStatus: "PAST_DUE", pastDueSince: null })).toBeNull();
  });

  it("días restantes redondeados hacia arriba", () => {
    const since = new Date(Date.now() - 2 * 86400000); // hace 2 días
    expect(pastDueGraceDaysLeft({ subscriptionStatus: "PAST_DUE", pastDueSince: since })).toBe(
      PAST_DUE_GRACE_DAYS - 2
    );
  });

  it("0 (no negativo) cuando la gracia ya venció", () => {
    const since = new Date(Date.now() - (PAST_DUE_GRACE_DAYS + 3) * 86400000);
    expect(pastDueGraceDaysLeft({ subscriptionStatus: "PAST_DUE", pastDueSince: since })).toBe(0);
  });
});
