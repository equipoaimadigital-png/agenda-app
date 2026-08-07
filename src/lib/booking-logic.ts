import type { Availability, DateException, Professional, Service } from "@prisma/client";
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

type ProfessionalContext = {
  professional: Professional;
  service: Service;
  availability: Availability[];
  exceptions: DateException[];
};

export async function loadBookingContext(
  slug: string,
  serviceId: string
): Promise<ProfessionalContext | null> {
  const professional = await prisma.professional.findUnique({
    where: { slug },
    include: { availability: true, dateExceptions: true },
  });
  if (!professional) return null;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id, active: true },
  });
  if (!service) return null;

  const { availability, dateExceptions, ...rest } = professional;
  return {
    professional: rest as Professional,
    service,
    availability,
    exceptions: dateExceptions,
  };
}

/** Horarios de inicio disponibles ("HH:MM") para una fecha dada. */
export async function daySlots(ctx: ProfessionalContext, dateStr: string): Promise<string[]> {
  const { professional, service, availability, exceptions } = ctx;

  const now = nowInTimeZone(professional.timezone);
  if (dateStr < now.dateStr) return [];
  if (exceptions.some((e) => e.date === dateStr)) return [];

  const dayBlocks = availability.filter((b) => b.weekday === weekdayOf(dateStr));
  if (dayBlocks.length === 0) return [];

  const dayStart = wallClockDate(dateStr, "00:00");
  const dayEnd = wallClockDate(dateStr, "23:59");
  const existing = await prisma.booking.findMany({
    where: {
      professionalId: professional.id,
      status: "CONFIRMED",
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: { startTime: true, endTime: true },
  });

  const busy = existing.map((b) => ({
    startMinutes: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
    endMinutes: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
  }));

  const minMinutesFromNow = dateStr === now.dateStr ? now.minutes : null;

  return computeAvailableSlots(
    dayBlocks.map((b) => ({ startMinutes: b.startMinutes, endMinutes: b.endMinutes })),
    service.durationMin,
    busy,
    minMinutesFromNow
  ).map(minutesToTime);
}

/** Fechas ("YYYY-MM-DD") con al menos un horario libre dentro de un mes. */
export async function monthAvailability(
  ctx: ProfessionalContext,
  year: number,
  month: number
): Promise<string[]> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = nowInTimeZone(ctx.professional.timezone);
  const result: string[] = [];

  // Trae todas las reservas del mes en una sola consulta
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59);
  const bookings = await prisma.booking.findMany({
    where: {
      professionalId: ctx.professional.id,
      status: "CONFIRMED",
      startTime: { gte: monthStart, lte: monthEnd },
    },
    select: { startTime: true, endTime: true },
  });

  const busyByDate = new Map<string, { startMinutes: number; endMinutes: number }[]>();
  for (const b of bookings) {
    const { dateStr } = wallClockOf(b.startTime);
    const list = busyByDate.get(dateStr) ?? [];
    list.push({
      startMinutes: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
      endMinutes: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
    });
    busyByDate.set(dateStr, list);
  }

  const exceptionDates = new Set(ctx.exceptions.map((e) => e.date));

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr < now.dateStr) continue;
    if (exceptionDates.has(dateStr)) continue;

    const dayBlocks = ctx.availability.filter((b) => b.weekday === weekdayOf(dateStr));
    if (dayBlocks.length === 0) continue;

    const slots = computeAvailableSlots(
      dayBlocks.map((b) => ({ startMinutes: b.startMinutes, endMinutes: b.endMinutes })),
      ctx.service.durationMin,
      busyByDate.get(dateStr) ?? [],
      dateStr === now.dateStr ? now.minutes : null
    );
    if (slots.length > 0) result.push(dateStr);
  }

  return result;
}

export type DaySuggestion = { dateStr: string; slots: string[] };

/** Próximos días con horarios libres a partir de una fecha (para sugerencias). */
export async function nextAvailableDays(
  ctx: ProfessionalContext,
  fromDateStr: string,
  maxDaysToScan = 30,
  maxSuggestions = 3
): Promise<DaySuggestion[]> {
  const suggestions: DaySuggestion[] = [];
  let cursor = fromDateStr;
  for (let i = 0; i < maxDaysToScan && suggestions.length < maxSuggestions; i++) {
    const slots = await daySlots(ctx, cursor);
    if (slots.length > 0) {
      suggestions.push({ dateStr: cursor, slots: slots.slice(0, 4) });
    }
    cursor = addDays(cursor, 1);
  }
  return suggestions;
}
