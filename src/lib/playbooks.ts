import { prisma } from "@/lib/db";
import { weekdayOf } from "@/lib/dates";
import { expectedIntervalDays } from "@/lib/reactivation";
import { CLIENT_NAME_VAR } from "@/lib/campaign-copy";

/**
 * Playbooks — recetas de campaña que se sugieren solas según el perfil de
 * clientes del negocio. Cero IA: cada una tiene una condición numérica de
 * disparo, una audiencia y un texto listo para editar y enviar.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const CAMPAIGN_COOLDOWN_DAYS = 14;

export type PlaybookId =
  | "primeras_visitas"
  | "habituales_enfriados"
  | "dia_flojo"
  | "cumpleanos_mes";

export type PlaybookTarget = { phone: string; name: string; email: string };

export type Playbook = {
  id: PlaybookId;
  title: string;
  /** Por qué se sugiere, con los números reales del negocio. */
  why: string;
  /** Consejo corto de cómo aprovecharla. */
  tip: string;
  subject: string;
  body: string;
  targets: PlaybookTarget[];
};

const WEEKDAY_NAME = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

/** De un arreglo de 7 contadores (0=domingo), el día abierto más flojo y el
 *  más cargado. "Abierto" = tiene al menos una reserva histórica. */
export function quietestBusiestWeekday(
  counts: number[]
): { quietest: number; busiest: number; openedDays: number } | null {
  const opened = counts.map((c, i) => ({ c, i })).filter((x) => x.c > 0);
  if (opened.length < 3) return null;
  let quietest = opened[0];
  let busiest = opened[0];
  for (const x of opened) {
    if (x.c < quietest.c) quietest = x;
    if (x.c > busiest.c) busiest = x;
  }
  return { quietest: quietest.i, busiest: busiest.i, openedDays: opened.length };
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export async function getPlaybooks(professionalId: string): Promise<Playbook[]> {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const business = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { businessName: true },
  });
  const businessName = business?.businessName ?? "tu negocio";

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
        birthday: true,
        unsubscribed: true,
        lastCampaignAt: true,
      },
    }),
  ]);

  const upcomingPhones = new Set(upcoming.map((b) => b.clientPhone));
  const clientByPhone = new Map(clients.map((c) => [c.phone, c]));

  type Agg = { count: number; first: Date; last: Date; name: string; email: string | null };
  const byPhone = new Map<string, Agg>();
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);

  for (const b of pastBookings) {
    if (b.startTime >= ninetyDaysAgo) {
      weekdayCounts[weekdayOf(b.startTime.toISOString().slice(0, 10))] += 1;
    }
    const cur = byPhone.get(b.clientPhone);
    if (!cur) {
      byPhone.set(b.clientPhone, {
        count: 1,
        first: b.startTime,
        last: b.startTime,
        name: b.clientName,
        email: b.clientEmail,
      });
    } else {
      cur.count += 1;
      cur.last = b.startTime;
      cur.name = b.clientName;
      cur.email = b.clientEmail;
    }
  }

  const totalClients = byPhone.size;
  const perClientAvg: number[] = [];
  for (const agg of byPhone.values()) {
    if (agg.count >= 2) {
      perClientAvg.push((agg.last.getTime() - agg.first.getTime()) / DAY_MS / (agg.count - 1));
    }
  }
  const medianDays =
    perClientAvg.length > 0
      ? [...perClientAvg].sort((a, b) => a - b)[Math.floor(perClientAvg.length / 2)]
      : 45;

  const inCooldown = (phone: string): boolean => {
    const c = clientByPhone.get(phone);
    return !!(
      c?.lastCampaignAt && (now.getTime() - c.lastCampaignAt.getTime()) / DAY_MS < CAMPAIGN_COOLDOWN_DAYS
    );
  };
  const isReachable = (phone: string): boolean => {
    const c = clientByPhone.get(phone);
    const email = c?.email ?? byPhone.get(phone)?.email ?? null;
    return !!email && !c?.unsubscribed;
  };
  const targetOf = (phone: string): PlaybookTarget => {
    const c = clientByPhone.get(phone);
    const agg = byPhone.get(phone)!;
    return { phone, name: c?.name || agg.name, email: (c?.email || agg.email)! };
  };

  const playbooks: Playbook[] = [];

  // ── PB1 · Recuperar primeras visitas ────────────────────────────────
  {
    const oneVisit: string[] = [];
    for (const [phone, agg] of byPhone) {
      if (agg.count !== 1) continue;
      const daysSince = (now.getTime() - agg.last.getTime()) / DAY_MS;
      if (daysSince < 21) continue;
      if (upcomingPhones.has(phone) || inCooldown(phone) || !isReachable(phone)) continue;
      oneVisit.push(phone);
    }
    const ratio = totalClients === 0 ? 0 : oneVisit.length / totalClients;
    if (oneVisit.length >= 5 && ratio >= 0.3) {
      playbooks.push({
        id: "primeras_visitas",
        title: "Recuperar primeras visitas",
        why: `El ${pct(oneVisit.length, totalClients)}% de tus clientes vino una sola vez. Hay ${oneVisit.length} con email a los que se les puede escribir; recuperar aunque sea 1 de cada 5 ya paga la campaña.`,
        tip: "Rinde más sin descuento: una invitación honesta convierte mejor que una oferta agresiva.",
        subject: `¿Cómo te fue en ${businessName}?`,
        body: `Hola ${CLIENT_NAME_VAR},\n\nVimos que nos visitaste una vez y no queremos que te pierdas la próxima. Si te quedó alguna duda, escríbenos; y si quieres volver, deja tu hora agendada desde el botón de abajo.\n\n¡Te esperamos!`,
        targets: oneVisit.map(targetOf),
      });
    }
  }

  // ── PB2 · Reactivar habituales que se enfriaron ─────────────────────
  {
    const slipping: string[] = [];
    for (const [phone, agg] of byPhone) {
      if (agg.count < 3) continue;
      const expected = expectedIntervalDays(
        { visitCount: agg.count, firstVisitAt: agg.first, lastVisitAt: agg.last },
        medianDays
      );
      const daysSince = (now.getTime() - agg.last.getTime()) / DAY_MS;
      if (daysSince <= expected * 1.5) continue;
      if (upcomingPhones.has(phone) || inCooldown(phone) || !isReachable(phone)) continue;
      slipping.push(phone);
    }
    if (slipping.length >= 3) {
      playbooks.push({
        id: "habituales_enfriados",
        title: "Reactivar habituales que se enfriaron",
        why: `${slipping.length} clientes que venían seguido llevan bastante más de su ritmo sin aparecer. Son los más fáciles de traer de vuelta: ya te conocen.`,
        tip: "Un mensaje que se sienta personal (aunque sea el mismo para todos) rinde más que una promo.",
        subject: "Te echamos de menos 💚",
        body: `Hola ${CLIENT_NAME_VAR},\n\nYa eres de la casa y hace un tiempo que no te vemos. Nos encantaría recibirte de nuevo — deja tu próxima hora agendada cuando quieras desde el botón de abajo.\n\n¡Un abrazo!`,
        targets: slipping.map(targetOf),
      });
    }
  }

  // ── PB3 · Llenar el día más flojo de la semana ─────────────────────
  {
    const wb = quietestBusiestWeekday(weekdayCounts);
    const totalRecent = weekdayCounts.reduce((a, b) => a + b, 0);
    if (wb && totalRecent >= 20 && weekdayCounts[wb.quietest] <= weekdayCounts[wb.busiest] * 0.5) {
      const active: string[] = [];
      for (const [phone, agg] of byPhone) {
        const daysSince = (now.getTime() - agg.last.getTime()) / DAY_MS;
        if (daysSince > 120) continue;
        if (upcomingPhones.has(phone) || inCooldown(phone) || !isReachable(phone)) continue;
        active.push(phone);
      }
      if (active.length >= 5) {
        const quiet = WEEKDAY_NAME[wb.quietest];
        const busy = WEEKDAY_NAME[wb.busiest];
        playbooks.push({
          id: "dia_flojo",
          title: `Llenar los ${quiet}`,
          why: `Los ${quiet} son tu día más tranquilo (${weekdayCounts[wb.quietest]} reservas en 90 días vs ${weekdayCounts[wb.busiest]} los ${busy}). Un empujón puede equilibrar la semana.`,
          tip: "Ofrece el día, no un descuento: muchos clientes prefieren un horario cómodo.",
          subject: `Los ${quiet} tenemos más espacio para ti`,
          body: `Hola ${CLIENT_NAME_VAR},\n\nSi te acomoda venir un ${quiet}, tenemos más horarios libres y la atención es más tranquila. Reserva tu próxima hora desde el botón de abajo.\n\n¡Nos vemos!`,
          targets: active.map(targetOf),
        });
      }
    }
  }

  // ── PB4 · Saludo de cumpleaños del mes ─────────────────────────────
  {
    const birthdayPhones: string[] = [];
    for (const c of clients) {
      if (!c.birthday || !c.birthday.startsWith(`${mm}-`)) continue;
      if (c.unsubscribed || !c.email) continue;
      birthdayPhones.push(c.phone);
    }
    if (birthdayPhones.length >= 1) {
      playbooks.push({
        id: "cumpleanos_mes",
        title: "Saludo de cumpleaños del mes",
        why: `${birthdayPhones.length} cliente${birthdayPhones.length === 1 ? "" : "s"} cumple${birthdayPhones.length === 1 ? "" : "n"} años este mes. Un saludo con invitación a celebrar tiene de las tasas de respuesta más altas.`,
        tip: "Envíalo a principios de mes: les da tiempo a agendar para su cumpleaños.",
        subject: `¡Feliz cumpleaños de parte de ${businessName}! 🎂`,
        body: `Hola ${CLIENT_NAME_VAR},\n\n¡Feliz cumpleaños! Queríamos saludarte y, de paso, invitarte a celebrar con nosotros. Reserva tu hora este mes desde el botón de abajo.\n\nUn abrazo,\n${businessName}`,
        targets: birthdayPhones.map((phone) => {
          const c = clientByPhone.get(phone)!;
          return { phone, name: c.name || "", email: c.email! };
        }),
      });
    }
  }

  return playbooks.sort((a, b) => b.targets.length - a.targets.length);
}
