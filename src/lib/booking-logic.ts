import type {
  Availability,
  DateException,
  Prisma,
  Professional,
  Service,
  Staff,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeAvailableSlots } from "@/lib/slots";
import {
  addDays,
  minutesToTime,
  nowInTimeZone,
  weekdayOf,
  wallClockDate,
  wallClockOf,
} from "@/lib/dates";

// Cuánto tiempo se le da a un cliente para completar el pago del depósito
// antes de que el horario se libere solo. No depende de que corra un cron:
// las tres consultas de disponibilidad de abajo dejan de contar una
// reserva PENDING_PAYMENT como "ocupada" pasado este plazo, así que el
// sistema se autolimpia en cada lectura sin importar cada cuánto corre el
// cron de limpieza (el plan gratuito de Vercel solo permite crons 1x/día).
export const PENDING_PAYMENT_TIMEOUT_MIN = 30;

function pendingPaymentCutoff(): Date {
  return new Date(Date.now() - PENDING_PAYMENT_TIMEOUT_MIN * 60 * 1000);
}

/** Un booking retiene el horario si está CONFIRMED, o si es un depósito
 * pendiente que todavía está dentro del plazo para pagarse. */
function activeBookingStatusFilter(): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: "CONFIRMED" },
      { status: "PENDING_PAYMENT", createdAt: { gte: pendingPaymentCutoff() } },
    ],
  };
}

/** Valor especial de staffId que significa "cualquiera disponible". */
export const ANY_STAFF = "any" as const;
export type StaffSelection = string | typeof ANY_STAFF;

type StaffOption = {
  staff: Staff;
  availability: Availability[];
  exceptions: DateException[];
};

type BookingContext = {
  professional: Professional;
  service: Service;
  /** Solo el staff activo que puede realizar este servicio. */
  staffOptions: StaffOption[];
};

/**
 * Ejecuta `fn` dentro de una transacción con bloqueo exclusivo sobre un
 * profesional (Staff) puntual. Sin esto, dos reservas simultáneas para el
 * mismo profesional pueden pasar ambas la validación de solapamiento y crear
 * una doble reserva en el mismo horario: el `findFirst` de una ocurre antes
 * de que la otra haya hecho su `create`.
 *
 * El bloqueo es por `staffId`, no por negocio: dos profesionales distintos
 * del mismo local pueden reservarse en paralelo sin esperarse entre sí.
 *
 * El bloqueo es a nivel de transacción (`pg_advisory_xact_lock`), así que se
 * libera solo al commit o rollback y es seguro con el pooler de Supabase.
 */
export async function withStaffLock<T>(
  staffId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // pg_advisory_xact_lock devuelve void: $queryRaw no puede deserializar eso
    // (falla con "Failed to deserialize column of type 'void'"). $executeRaw
    // no intenta leer un resultado, así que es lo correcto para esta llamada.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${staffId}::text))`;
    return fn(tx);
  });
}

/**
 * ¿Existe una reserva confirmada de este Staff que choque con el rango dado?
 * Debe llamarse dentro de `withStaffLock(staffId, ...)` para que el resultado
 * siga siendo válido al momento de escribir.
 */
export async function hasOverlappingBooking(
  tx: Prisma.TransactionClient,
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const overlapping = await tx.booking.findFirst({
    where: {
      staffId,
      // PENDING_PAYMENT también retiene el horario — un cliente pagando un
      // depósito no debe perder su cupo frente a otro que reserva mientras
      // tanto — pero solo mientras está dentro del plazo para pagar.
      ...activeBookingStatusFilter(),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true },
  });
  return overlapping !== null;
}

export async function loadBookingContext(
  slug: string,
  serviceId: string
): Promise<BookingContext | null> {
  const professional = await prisma.professional.findUnique({ where: { slug } });
  if (!professional) return null;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id, active: true },
  });
  if (!service) return null;

  const staff = await prisma.staff.findMany({
    where: {
      professionalId: professional.id,
      active: true,
      services: { some: { id: serviceId } },
      // Un profesional sin ningún bloque de horario nunca puede recibir una
      // reserva — mostrarlo como opción (y dejar que el calendario aparezca
      // "disponible" para él) solo confunde. Se excluye del flujo público.
      availability: { some: {} },
    },
    include: { availability: true, dateExceptions: true },
  });

  const staffOptions: StaffOption[] = staff.map((s) => {
    const { availability, dateExceptions, ...rest } = s;
    return { staff: rest as Staff, availability, exceptions: dateExceptions };
  });

  return { professional, service, staffOptions };
}

/**
 * Chequeo en memoria (sin tocar la base) de si un Staff tiene algún bloque de
 * disponibilidad ese día. Se usa para cortar antes de la query de reservas —
 * clave para `nextAvailableDays`, que escanea hasta 30 días: sin esto, un
 * profesional sin horario configurado dispara 30 queries inútiles.
 */
/** Solo un bloqueo de DÍA COMPLETO (startMin null) cierra el día. Los
 *  bloqueos de franja horaria se aplican como "ocupado" en daySlotsForOption. */
function optionOpenOn(option: StaffOption, dateStr: string): boolean {
  if (option.exceptions.some((e) => e.date === dateStr && e.startMin == null)) return false;
  return option.availability.some((b) => b.weekday === weekdayOf(dateStr));
}

/** Rangos "ocupados" que provienen de bloqueos de franja horaria (no del día
 *  completo) para una fecha. Exportada para pruebas. */
export function blockedRangesForDate(
  exceptions: Pick<DateException, "date" | "startMin" | "endMin">[],
  dateStr: string
): { startMinutes: number; endMinutes: number }[] {
  return exceptions
    .filter((e) => e.date === dateStr && e.startMin != null && e.endMin != null)
    .map((e) => ({ startMinutes: e.startMin as number, endMinutes: e.endMin as number }));
}

/** Horarios de inicio disponibles ("HH:MM") para un Staff puntual en una fecha. */
function daySlotsForOption(
  professional: Professional,
  service: Service,
  option: StaffOption,
  dateStr: string,
  busy: { startMinutes: number; endMinutes: number }[]
): string[] {
  if (option.exceptions.some((e) => e.date === dateStr && e.startMin == null)) return [];

  const dayBlocks = option.availability.filter((b) => b.weekday === weekdayOf(dateStr));
  if (dayBlocks.length === 0) return [];

  const now = nowInTimeZone(professional.timezone);
  const minMinutesFromNow = dateStr === now.dateStr ? now.minutes : null;

  return computeAvailableSlots(
    dayBlocks.map((b) => ({ startMinutes: b.startMinutes, endMinutes: b.endMinutes })),
    service.durationMin,
    [...busy, ...blockedRangesForDate(option.exceptions, dateStr)],
    minMinutesFromNow
  ).map(minutesToTime);
}

async function busyRangesFor(staffId: string, dateStr: string) {
  const dayStart = wallClockDate(dateStr, "00:00");
  const dayEnd = wallClockDate(dateStr, "23:59");
  const existing = await prisma.booking.findMany({
    where: { staffId, ...activeBookingStatusFilter(), startTime: { gte: dayStart, lte: dayEnd } },
    select: { startTime: true, endTime: true },
  });
  return existing.map((b) => ({
    startMinutes: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
    endMinutes: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
  }));
}

/**
 * Horarios disponibles para una fecha dada.
 * - `staffId` puntual: solo los horarios de ese profesional.
 * - `ANY_STAFF`: la unión de horarios de todo el staff elegible ese día
 *   (para la opción "Cualquiera disponible").
 */
export async function daySlots(
  ctx: BookingContext,
  selection: StaffSelection,
  dateStr: string
): Promise<string[]> {
  const now = nowInTimeZone(ctx.professional.timezone);
  if (dateStr < now.dateStr) return [];

  if (selection !== ANY_STAFF) {
    const option = ctx.staffOptions.find((o) => o.staff.id === selection);
    if (!option || !optionOpenOn(option, dateStr)) return [];
    const busy = await busyRangesFor(selection, dateStr);
    return daySlotsForOption(ctx.professional, ctx.service, option, dateStr, busy);
  }

  const openOptions = ctx.staffOptions.filter((o) => optionOpenOn(o, dateStr));
  if (openOptions.length === 0) return [];

  const busyByStaff = await Promise.all(
    openOptions.map((o) => busyRangesFor(o.staff.id, dateStr))
  );
  const slotSet = new Set<string>();
  openOptions.forEach((option, i) => {
    for (const slot of daySlotsForOption(ctx.professional, ctx.service, option, dateStr, busyByStaff[i])) {
      slotSet.add(slot);
    }
  });
  return [...slotSet].sort();
}

/** Fechas ("YYYY-MM-DD") con al menos un horario libre dentro de un mes. */
export async function monthAvailability(
  ctx: BookingContext,
  selection: StaffSelection,
  year: number,
  month: number
): Promise<string[]> {
  const options =
    selection === ANY_STAFF
      ? ctx.staffOptions
      : ctx.staffOptions.filter((o) => o.staff.id === selection);
  if (options.length === 0) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const now = nowInTimeZone(ctx.professional.timezone);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59);

  // Trae las reservas del mes de todos los staff candidatos en una sola consulta
  const staffIds = options.map((o) => o.staff.id);
  const bookings = await prisma.booking.findMany({
    where: {
      staffId: { in: staffIds },
      ...activeBookingStatusFilter(),
      startTime: { gte: monthStart, lte: monthEnd },
    },
    select: { staffId: true, startTime: true, endTime: true },
  });

  const busyByStaffDate = new Map<string, { startMinutes: number; endMinutes: number }[]>();
  for (const b of bookings) {
    const { dateStr } = wallClockOf(b.startTime);
    const key = `${b.staffId}|${dateStr}`;
    const list = busyByStaffDate.get(key) ?? [];
    list.push({
      startMinutes: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
      endMinutes: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
    });
    busyByStaffDate.set(key, list);
  }

  const result: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr < now.dateStr) continue;

    const hasSlot = options.some((option) => {
      const busy = busyByStaffDate.get(`${option.staff.id}|${dateStr}`) ?? [];
      return daySlotsForOption(ctx.professional, ctx.service, option, dateStr, busy).length > 0;
    });
    if (hasSlot) result.push(dateStr);
  }

  return result;
}

export type DaySuggestion = { dateStr: string; slots: string[] };

/** Próximos días con horarios libres a partir de una fecha (para sugerencias). */
export async function nextAvailableDays(
  ctx: BookingContext,
  selection: StaffSelection,
  fromDateStr: string,
  maxDaysToScan = 30,
  maxSuggestions = 3
): Promise<DaySuggestion[]> {
  // Si el/los profesional(es) en juego no tienen ningún bloque de
  // disponibilidad configurado, no hay nada que escanear — así el mensaje de
  // "sin cupos" aparece al instante en vez de tras 30 consultas.
  const relevant =
    selection === ANY_STAFF
      ? ctx.staffOptions
      : ctx.staffOptions.filter((o) => o.staff.id === selection);
  if (relevant.every((o) => o.availability.length === 0)) return [];

  const suggestions: DaySuggestion[] = [];
  let cursor = fromDateStr;
  for (let i = 0; i < maxDaysToScan && suggestions.length < maxSuggestions; i++) {
    const slots = await daySlots(ctx, selection, cursor);
    if (slots.length > 0) {
      suggestions.push({ dateStr: cursor, slots: slots.slice(0, 4) });
    }
    cursor = addDays(cursor, 1);
  }
  return suggestions;
}
