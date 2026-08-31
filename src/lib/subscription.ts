import type { Professional } from "@prisma/client";

export const TRIAL_DAYS = 14;
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
  professional: Pick<Professional, "subscriptionStatus" | "trialEndsAt">
): boolean {
  if (professional.subscriptionStatus === "ACTIVE") return true;
  if (professional.subscriptionStatus === "TRIAL") {
    return !professional.trialEndsAt || new Date() < professional.trialEndsAt;
  }
  return false;
}
