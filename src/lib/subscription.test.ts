import { describe, expect, it } from "vitest";
import { hasDashboardAccess } from "./subscription";

const future = new Date(Date.now() + 5 * 86400000);
const past = new Date(Date.now() - 5 * 86400000);
const base = { billingExempt: false } as const;

describe("hasDashboardAccess", () => {
  it("cuenta exenta de cobro tiene acceso aunque todo lo demás esté vencido", () => {
    expect(
      hasDashboardAccess({
        billingExempt: true,
        subscriptionStatus: "CANCELLED",
        trialEndsAt: past,
        subscriptionPaidUntil: past,
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
