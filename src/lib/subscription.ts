import type { Professional } from "@prisma/client";

export const TRIAL_DAYS = 14;
export const SUBSCRIPTION_PRICE_CLP = 12000;

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
