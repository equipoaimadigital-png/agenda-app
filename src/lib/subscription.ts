import type { Professional } from "@prisma/client";

export const TRIAL_DAYS = 10;
/** Precio mensual del plan, en CLP. Fuente única — mercadopago.ts lo importa
 *  de acá para que el cobro real y lo que se muestra nunca queden desfasados.
 *  OJO: Mercado Pago congela el monto de cada Preapproval al crearla, así que
 *  un cambio acá solo afecta a las suscripciones NUEVAS; las vigentes siguen
 *  pagando el monto con el que se dieron de alta. */
export const SUBSCRIPTION_PRICE_CLP = 14990;

/** ¿Puede este profesional usar el panel ahora mismo? La página pública de
 * reserva (/reservar/[slug]) y "Mi reserva" (/reserva/[token]) NUNCA se
 * gatean con esto — solo el panel del profesional. */
export function hasDashboardAccess(
  professional: Pick<
    Professional,
    "subscriptionStatus" | "trialEndsAt" | "subscriptionPaidUntil" | "billingExempt"
  >
): boolean {
  // Cuentas de administración / comp: acceso siempre, sin importar el cobro.
  if (professional.billingExempt) return true;
  if (professional.subscriptionStatus === "ACTIVE") return true;
  // Camino de pago manual (pago único mensual): vale mientras la fecha
  // pagada esté en el futuro, sin importar subscriptionStatus.
  if (professional.subscriptionPaidUntil && new Date() < professional.subscriptionPaidUntil) {
    return true;
  }
  if (professional.subscriptionStatus === "TRIAL") {
    return !professional.trialEndsAt || new Date() < professional.trialEndsAt;
  }
  return false;
}

/** Días de plan que agrega cada pago único manual. */
export const MANUAL_PAYMENT_DAYS = 31;
