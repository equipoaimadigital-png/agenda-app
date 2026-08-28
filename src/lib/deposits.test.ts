import { describe, expect, it } from "vitest";
import { resolveDepositDecision } from "./deposits";

describe("resolveDepositDecision", () => {
  const base = { amount: 3000, mpConnected: true, clientOptedIn: false };

  it("NONE nunca cobra ni ofrece", () => {
    expect(resolveDepositDecision({ ...base, mode: "NONE" })).toEqual({
      offered: false,
      charge: false,
      amount: null,
    });
  });

  it("REQUIRED con todo listo cobra siempre, sin importar la elección del cliente", () => {
    expect(resolveDepositDecision({ ...base, mode: "REQUIRED", clientOptedIn: false })).toEqual({
      offered: false,
      charge: true,
      amount: 3000,
    });
  });

  it("OPTIONAL se ofrece pero solo cobra si el cliente lo eligió", () => {
    expect(resolveDepositDecision({ ...base, mode: "OPTIONAL", clientOptedIn: false })).toEqual({
      offered: true,
      charge: false,
      amount: 3000,
    });
    expect(resolveDepositDecision({ ...base, mode: "OPTIONAL", clientOptedIn: true })).toEqual({
      offered: true,
      charge: true,
      amount: 3000,
    });
  });

  it("sin cuenta de Mercado Pago conectada, ningún modo cobra ni ofrece", () => {
    expect(
      resolveDepositDecision({ ...base, mode: "REQUIRED", mpConnected: false })
    ).toEqual({ offered: false, charge: false, amount: null });
    expect(
      resolveDepositDecision({ ...base, mode: "OPTIONAL", mpConnected: false, clientOptedIn: true })
    ).toEqual({ offered: false, charge: false, amount: null });
  });

  it("sin monto (o monto no positivo), ningún modo cobra ni ofrece", () => {
    expect(resolveDepositDecision({ ...base, mode: "REQUIRED", amount: null })).toEqual({
      offered: false,
      charge: false,
      amount: null,
    });
    expect(resolveDepositDecision({ ...base, mode: "OPTIONAL", amount: 0, clientOptedIn: true })).toEqual({
      offered: false,
      charge: false,
      amount: null,
    });
  });
});
