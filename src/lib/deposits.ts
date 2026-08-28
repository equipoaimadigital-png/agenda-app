import type { DepositMode } from "@prisma/client";

/**
 * Decide qué hacer con el depósito de un servicio para una reserva concreta.
 * Pura y sin efectos — se usa tanto en la Server Action que crea la reserva
 * pública como en la UI para saber si mostrar la elección al cliente.
 */
export type DepositDecision = {
  /** El servicio ofrece al cliente elegir si asegura su hora (modo OPTIONAL, listo para cobrar). */
  offered: boolean;
  /** Esta reserva puntual debe crearse como PENDING_PAYMENT y mandar al cliente a pagar. */
  charge: boolean;
  /** Monto a cobrar (solo válido cuando `charge` u `offered` son true). */
  amount: number | null;
};

export function resolveDepositDecision(params: {
  mode: DepositMode;
  amount: number | null;
  /** El profesional tiene su cuenta de Mercado Pago conectada. */
  mpConnected: boolean;
  /** El cliente marcó "asegurar mi hora" en la página pública (solo aplica a OPTIONAL). */
  clientOptedIn: boolean;
}): DepositDecision {
  const { mode, amount, mpConnected, clientOptedIn } = params;

  // Sin cuenta conectada no hay a dónde mandar el cobro, y sin monto no hay
  // qué cobrar: en ambos casos la reserva se comporta como si no hubiera
  // depósito (mismo comportamiento previo a esta función).
  const ready = mpConnected && mode !== "NONE" && !!amount && amount > 0;
  if (!ready) return { offered: false, charge: false, amount: null };

  if (mode === "REQUIRED") return { offered: false, charge: true, amount };

  // OPTIONAL: se ofrece siempre; solo se cobra si el cliente lo eligió.
  return { offered: true, charge: clientOptedIn, amount };
}
