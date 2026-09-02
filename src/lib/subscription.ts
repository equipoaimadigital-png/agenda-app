import type { Professional } from "@prisma/client";

export const TRIAL_DAYS = 10;
/** Precio mensual del plan, en CLP. Fuente única — mercadopago.ts lo importa
 *  de acá para que el cobro real y lo que se muestra nunca queden desfasados.
 *  OJO: Mercado Pago congela el monto de cada Preapproval al crearla, así que
 *  un cambio acá solo afecta a las suscripciones NUEVAS; las vigentes siguen
 *  pagando el monto con el que se dieron de alta. */
export const SUBSCRIPTION_PRICE_CLP = 14990;

/** Días de gracia tras un cobro recurrente fallido antes de bloquear el
 *  panel. Una tarjeta vencida o un rechazo temporal no debe dejar al
 *  negocio sin agenda el mismo día. */
export const PAST_DUE_GRACE_DAYS = 7;

/** ¿Puede este profesional usar el panel ahora mismo? La página pública de
 * reserva (/reservar/[slug]) y "Mi reserva" (/reserva/[token]) NUNCA se
 * gatean con esto — solo el panel del profesional. */
export function hasDashboardAccess(
  professional: Pick<
    Professional,
    | "subscriptionStatus"
    | "trialEndsAt"
    | "subscriptionPaidUntil"
    | "pastDueSince"
    | "billingExempt"
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
  // Cobro recurrente fallido: período de gracia desde pastDueSince.
  if (professional.subscriptionStatus === "PAST_DUE" && professional.pastDueSince) {
    const graceEnd = new Date(
      professional.pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * 24 * 3600_000
    );
    if (new Date() < graceEnd) return true;
  }
  if (professional.subscriptionStatus === "TRIAL") {
    return !professional.trialEndsAt || new Date() < professional.trialEndsAt;
  }
  return false;
}

/** Días de gracia que quedan tras un cobro fallido; null si no aplica o ya
 *  se venció. Para mostrar el aviso en el panel. */
export function pastDueGraceDaysLeft(
  professional: Pick<Professional, "subscriptionStatus" | "pastDueSince">
): number | null {
  if (professional.subscriptionStatus !== "PAST_DUE" || !professional.pastDueSince) return null;
  const graceEnd = professional.pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * 24 * 3600_000;
  const ms = graceEnd - Date.now();
  return ms > 0 ? Math.ceil(ms / (24 * 3600_000)) : 0;
}

/** Días de plan que agrega cada pago único manual. */
export const MANUAL_PAYMENT_DAYS = 31;

/** Tope de mensajes de pago (SMS + WhatsApp) que incluye el plan por mes
 *  calendario y por cuenta. Al superarlo, esos dos canales se omiten (el
 *  correo sigue saliendo). Protege el presupuesto de Twilio ante un negocio
 *  con volumen muy alto. Se puede subir a mano si un cliente lo necesita. */
export const MONTHLY_MESSAGE_QUOTA = 1000;
