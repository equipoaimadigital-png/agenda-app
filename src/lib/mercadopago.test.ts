import { afterEach, describe, expect, it } from "vitest";
import { subscriptionCheckoutUrl } from "./mercadopago";

describe("subscriptionCheckoutUrl", () => {
  const prev = process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID;

  afterEach(() => {
    if (prev === undefined) delete process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID;
    else process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID = prev;
  });

  it("devuelve null si todavía no hay plan configurado", () => {
    delete process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID;
    expect(subscriptionCheckoutUrl("prof-1")).toBeNull();
  });

  it("arma la URL del checkout con el plan y el external_reference del profesional", () => {
    process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID = "plan-abc";
    const url = subscriptionCheckoutUrl("prof-1");
    expect(url?.startsWith("https://www.mercadopago.cl/subscriptions/checkout?")).toBe(true);
    expect(url).toContain("preapproval_plan_id=plan-abc");
    expect(url).toContain("external_reference=prof-1");
  });

  it("escapa caracteres especiales en el id del profesional", () => {
    process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID = "plan-abc";
    expect(subscriptionCheckoutUrl("a b/c")).toContain("external_reference=a+b%2Fc");
  });
});
