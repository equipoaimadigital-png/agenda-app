import { prisma } from "@/lib/db";

/**
 * Reactivación — sin IA, todo por reglas sobre el historial de citas.
 *
 * Idea: por cada cliente sabemos cada cuánto suele venir (su "cadencia").
 * Si lleva bastante más que eso sin aparecer, está "atrasado" y vale la
 * pena un empujón. Para el que vino una sola vez usamos la mediana del
 * negocio (o 45 días) como cadencia esperada.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Piso: nunca marcamos "atrasado" a alguien con menos de 21 días sin venir
 *  (evita molestar a un cliente semanal por un par de días de atraso). */
const MIN_DAYS_TO_NUDGE = 21;

/** Tras enviar una campaña, el cliente no vuelve a aparecer en Reactivación
 *  por este plazo — así no se quema la lista con avisos muy seguidos. */
const CAMPAIGN_COOLDOWN_DAYS = 14;

/** Cuánto historial y cuántos clientes hacen falta para que los números
 *  sean confiables. Debajo de esto, la página muestra "juntando datos". */
const MIN_HISTORY_DAYS = 30;
const MIN_ELIGIBLE_CLIENTS = 10;

const DEFAULT_INTERVAL_DAYS = 45;
/** Un cliente de negocio de citas realista vuelve entre ~2 semanas y ~4 meses.
 *  Fuera de ese rango la "cadencia" es ruido (historial escaso o cliente de
 *  una vez al año), así que se acota. */
const MIN_INTERVAL_DAYS = 14;
const MAX_INTERVAL_DAYS = 120;

function clampInterval(days: number): number {
  return Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(days)));
}

export type VisitStats = {
  visitCount: number;
  firstVisitAt: Date | null;
  lastVisitAt: Date | null;
};

/** Cadencia esperada de un cliente, en días. */
export function expectedIntervalDays(stats: VisitStats, businessMedianDays: number): number {
  if (stats.visitCount >= 2 && stats.firstVisitAt && stats.lastVisitAt) {
    const spanDays = (stats.lastVisitAt.getTime() - stats.firstVisitAt.getTime()) / DAY_MS;
    return clampInterval(spanDays / (stats.visitCount - 1));
  }
  return clampInterval(Math.round(businessMedianDays) || DEFAULT_INTERVAL_DAYS);
}

export type ReactivationStatus = "overdue" | "soon" | "ok" | "excluded";

export type ReactivationInput = VisitStats & {
  hasUpcoming: boolean;
  unsubscribed: boolean;
  lastCampaignAt: Date | null;
};

/** Clasifica a un cliente. Pura y testeable — no toca la base. */
export function classifyReactivation(
  input: ReactivationInput,
  now: Date,
  businessMedianDays: number
): { status: ReactivationStatus; daysSince: number | null; expected: number } {
  const expected = expectedIntervalDays(input, businessMedianDays);

  if (!input.lastVisitAt) return { status: "excluded", daysSince: null, expected };
  const daysSince = Math.floor((now.getTime() - input.lastVisitAt.getTime()) / DAY_MS);

  if (input.unsubscribed || input.hasUpcoming) {
    return { status: "excluded", daysSince, expected };
  }
  if (
    input.lastCampaignAt &&
    (now.getTime() - input.lastCampaignAt.getTime()) / DAY_MS < CAMPAIGN_COOLDOWN_DAYS
  ) {
    return { status: "excluded", daysSince, expected };
  }

  if (daysSince < MIN_DAYS_TO_NUDGE) return { status: "ok", daysSince, expected };
  if (daysSince > expected * 1.3) return { status: "overdue", daysSince, expected };
  if (daysSince > expected) return { status: "soon", daysSince, expected };
  return { status: "ok", daysSince, expected };
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type ReactivationClient = {
  phone: string;
  name: string;
  email: string | null;
  lastVisitAt: Date;
  daysSince: number;
  visitCount: number;
  expectedIntervalDays: number;
  status: "overdue" | "soon";
  oneTimeOnly: boolean;
};

export type ReactivationData = {
  ready: boolean;
  historyDays: number;
  eligibleClients: number;
  medianIntervalDays: number;
  overdue: ReactivationClient[];
  soon: ReactivationClient[];
  /** overdue que vinieron una sola vez (para la sugerencia). */
  oneTimeOverdue: number;
};

const MAX_LIST = 200;

/**
 * Arma la vista de Reactivación de un negocio. Trabaja sobre las reservas
 * (fuente de verdad de "vino o no"), agrupadas por teléfono, y cruza con la
 * ficha de cliente para email / desuscripción / cooldown de campaña.
 */
export async function getReactivationData(professionalId: string): Promise<ReactivationData> {
  const now = new Date();

  const [pastBookings, upcoming, clients] = await Promise.all([
    prisma.booking.findMany({
      where: {
        professionalId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startTime: { lte: now },
      },
      select: { clientPhone: true, clientName: true, clientEmail: true, startTime: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        professionalId,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        startTime: { gt: now },
      },
      select: { clientPhone: true },
    }),
    prisma.client.findMany({
      where: { professionalId },
      select: {
        phone: true,
        name: true,
        email: true,
        unsubscribed: true,
        lastCampaignAt: true,
      },
    }),
  ]);

  const upcomingPhones = new Set(upcoming.map((b) => b.clientPhone));
  const clientByPhone = new Map(clients.map((c) => [c.phone, c]));

  type Agg = {
    count: number;
    first: Date;
    last: Date;
    latestName: string;
    latestEmail: string | null;
  };
  const byPhone = new Map<string, Agg>();
  let earliestOverall: Date | null = null;

  for (const b of pastBookings) {
    if (!earliestOverall || b.startTime < earliestOverall) earliestOverall = b.startTime;
    const cur = byPhone.get(b.clientPhone);
    if (!cur) {
      byPhone.set(b.clientPhone, {
        count: 1,
        first: b.startTime,
        last: b.startTime,
        latestName: b.clientName,
        latestEmail: b.clientEmail,
      });
    } else {
      cur.count += 1;
      if (b.startTime < cur.first) cur.first = b.startTime;
      // pastBookings viene ordenado asc, así que el último en pasar es el más reciente
      cur.last = b.startTime;
      cur.latestName = b.clientName;
      cur.latestEmail = b.clientEmail;
    }
  }

  const historyDays = earliestOverall
    ? Math.floor((now.getTime() - earliestOverall.getTime()) / DAY_MS)
    : 0;
  const eligibleClients = byPhone.size;

  // Mediana del negocio: cadencia promedio de los clientes con 2+ visitas.
  const perClientAvg: number[] = [];
  for (const agg of byPhone.values()) {
    if (agg.count >= 2) {
      perClientAvg.push((agg.last.getTime() - agg.first.getTime()) / DAY_MS / (agg.count - 1));
    }
  }
  const rawMedian = Math.round(median(perClientAvg));
  const medianIntervalDays = rawMedian > 0 ? clampInterval(rawMedian) : DEFAULT_INTERVAL_DAYS;

  const overdue: ReactivationClient[] = [];
  const soon: ReactivationClient[] = [];

  for (const [phone, agg] of byPhone) {
    const client = clientByPhone.get(phone);
    const { status, daysSince, expected } = classifyReactivation(
      {
        visitCount: agg.count,
        firstVisitAt: agg.first,
        lastVisitAt: agg.last,
        hasUpcoming: upcomingPhones.has(phone),
        unsubscribed: client?.unsubscribed ?? false,
        lastCampaignAt: client?.lastCampaignAt ?? null,
      },
      now,
      medianIntervalDays
    );
    if (status !== "overdue" && status !== "soon") continue;
    if (daysSince === null) continue;

    const row: ReactivationClient = {
      phone,
      name: client?.name || agg.latestName,
      email: client?.email || agg.latestEmail,
      lastVisitAt: agg.last,
      daysSince,
      visitCount: agg.count,
      expectedIntervalDays: expected,
      status,
      oneTimeOnly: agg.count === 1,
    };
    (status === "overdue" ? overdue : soon).push(row);
  }

  overdue.sort((a, b) => b.daysSince - a.daysSince);
  soon.sort((a, b) => b.daysSince - a.daysSince);

  return {
    ready: historyDays >= MIN_HISTORY_DAYS && eligibleClients >= MIN_ELIGIBLE_CLIENTS,
    historyDays,
    eligibleClients,
    medianIntervalDays,
    overdue: overdue.slice(0, MAX_LIST),
    soon: soon.slice(0, MAX_LIST),
    oneTimeOverdue: overdue.filter((c) => c.oneTimeOnly).length,
  };
}

/** Solo el conteo, para la tarjeta del inicio del dashboard. */
export async function getReactivationCount(professionalId: string): Promise<number> {
  const data = await getReactivationData(professionalId);
  return data.ready ? data.overdue.length : 0;
}
