import type { MessageChannel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MONTHLY_MESSAGE_QUOTA, TRIAL_MESSAGE_QUOTA } from "@/lib/subscription";

/**
 * Tope mensual de SMS + WhatsApp por cuenta. El mes se cuenta en UTC (mes
 * calendario) — es un límite de costo, no algo que el cliente vea, así que
 * no vale la pena complicarlo con la zona horaria del negocio.
 */

export type QuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  /** 0..1 */
  pct: number;
  overLimit: boolean;
  /** true a partir del 90% */
  nearLimit: boolean;
};

/** [inicio, fin) del mes calendario UTC que contiene `now`. */
export function monthWindowUTC(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function quotaStatus(used: number, limit = MONTHLY_MESSAGE_QUOTA): QuotaStatus {
  const safeUsed = Math.max(0, used);
  const remaining = Math.max(0, limit - safeUsed);
  const pct = limit > 0 ? safeUsed / limit : 1;
  return {
    used: safeUsed,
    limit,
    remaining,
    pct,
    overLimit: safeUsed >= limit,
    nearLimit: pct >= 0.9,
  };
}

/** Cuántos SMS + WhatsApp lleva esta cuenta en el mes calendario actual. */
export async function messagesUsedThisMonth(professionalId: string): Promise<number> {
  const { start, end } = monthWindowUTC(new Date());
  return prisma.messageLog.count({
    where: { professionalId, createdAt: { gte: start, lt: end } },
  });
}

/** El tope que le corresponde a ESTA cuenta ahora mismo: el reducido de
 *  prueba gratis mientras está en trial y no ha pagado nada todavía, o el
 *  del plan pagado en cualquier otro caso (activo, pago manual vigente,
 *  atrasado en gracia, o cuenta exenta). Si no se encuentra el profesional
 *  se usa el tope de pago por defecto (nunca deja pasar de más por error). */
async function effectiveMonthlyLimit(professionalId: string): Promise<number> {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { subscriptionStatus: true, billingExempt: true, subscriptionPaidUntil: true },
  });
  if (!professional) return MONTHLY_MESSAGE_QUOTA;

  const manualActive =
    !!professional.subscriptionPaidUntil && new Date() < professional.subscriptionPaidUntil;
  const inTrial =
    professional.subscriptionStatus === "TRIAL" && !professional.billingExempt && !manualActive;
  return inTrial ? TRIAL_MESSAGE_QUOTA : MONTHLY_MESSAGE_QUOTA;
}

export async function messagingQuota(professionalId: string): Promise<QuotaStatus> {
  const limit = await effectiveMonthlyLimit(professionalId);
  return quotaStatus(await messagesUsedThisMonth(professionalId), limit);
}

/**
 * ¿Puede esta cuenta mandar otro SMS/WhatsApp de pago ahora? Ante un fallo
 * de base de datos deja pasar (fail-open): un problema transitorio no debe
 * dejar a los clientes sin aviso.
 */
export async function canSendPaidMessage(professionalId: string): Promise<boolean> {
  try {
    const limit = await effectiveMonthlyLimit(professionalId);
    return (await messagesUsedThisMonth(professionalId)) < limit;
  } catch (err) {
    console.error("[messaging-quota] no se pudo consultar el uso, se deja pasar:", err);
    return true;
  }
}

/** Registra un envío exitoso. Best-effort: nunca lanza. */
export async function recordPaidMessage(
  professionalId: string,
  channel: MessageChannel
): Promise<void> {
  try {
    await prisma.messageLog.create({ data: { professionalId, channel } });
  } catch (err) {
    console.error("[messaging-quota] no se pudo registrar el mensaje:", err);
  }
}
