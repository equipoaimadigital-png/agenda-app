import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { BookingRow, type BookingRowData } from "@/components/dashboard/BookingRow";
import { CancelDayButton } from "@/components/dashboard/CancelDayButton";
import { EmptyAgenda } from "@/components/dashboard/EmptyAgenda";
import { formatDateLong, nowInTimeZone, wallClockOf } from "@/lib/dates";
import { industryPreset } from "@/lib/industries";

export default async function AgendaPage() {
  const professional = await requireDashboardAccess();

  // Últimos 7 días (para marcar atendida/no-show) + todo lo futuro
  const from = new Date();
  from.setDate(from.getDate() - 7);
  from.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { professionalId: professional.id, startTime: { gte: from } },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  const now = nowInTimeZone(professional.timezone);

  const todayBookings = bookings.filter((b) => {
    const { dateStr } = wallClockOf(b.startTime);
    return dateStr === now.dateStr && b.status === "CONFIRMED";
  });

  // La próxima cita real (no solo la de hoy): la primera confirmada cuyo
  // inicio todavía no llega. `bookings` ya viene ordenado por startTime asc.
  const nextBooking = bookings.find((b) => {
    if (b.status !== "CONFIRMED") return false;
    const { dateStr } = wallClockOf(b.startTime);
    if (dateStr > now.dateStr) return true;
    if (dateStr < now.dateStr) return false;
    return b.startTime.getHours() * 60 + b.startTime.getMinutes() >= now.minutes;
  });

  const hasAnyBookingEver = bookings.length > 0 || (await prisma.booking.count({ where: { professionalId: professional.id } })) > 0;

  // Historial del cliente: cuántas veces ese mismo teléfono ha reservado en
  // total con este negocio (incluye esta cita), para dar continuidad entre
  // consultas/sesiones sin necesitar una ficha de cliente completa.
  const phones = [...new Set(bookings.map((b) => b.clientPhone))];
  const visitCounts =
    phones.length > 0
      ? await prisma.booking.groupBy({
          by: ["clientPhone"],
          where: {
            professionalId: professional.id,
            clientPhone: { in: phones },
            status: { not: "CANCELLED" },
          },
          _count: { _all: true },
        })
      : [];
  const visitCountByPhone = new Map(visitCounts.map((v) => [v.clientPhone, v._count._all]));
  const historyLabel = industryPreset(professional.industry).historyLabel;

  // Agrupa por fecha
  const groups = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const { dateStr } = wallClockOf(b.startTime);
    const list = groups.get(dateStr) ?? [];
    list.push(b);
    groups.set(dateStr, list);
  }
  const sortedDates = [...groups.keys()].sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Agenda</h1>
        <p className="text-sm text-stone mt-1">
          Tus citas de los últimos 7 días y las próximas.
        </p>
      </div>

      {(todayBookings.length > 0 || nextBooking) && (
        <section className="bg-brand-soft border border-border rounded-xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          {todayBookings.length > 0 && (
            <div>
              <p className="text-xs text-stone uppercase tracking-wide">Hoy</p>
              <p className="font-semibold font-numeric">
                {todayBookings.length} cita{todayBookings.length === 1 ? "" : "s"} confirmada
                {todayBookings.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
          {nextBooking && (
            <div>
              <p className="text-xs text-stone uppercase tracking-wide">Próxima cita</p>
              <p className="font-semibold font-numeric">
                {wallClockOf(nextBooking.startTime).dateStr === now.dateStr
                  ? `Hoy ${wallClockOf(nextBooking.startTime).time}`
                  : `${wallClockOf(nextBooking.startTime).time}, ${formatDateLong(wallClockOf(nextBooking.startTime).dateStr)}`}{" "}
                · {nextBooking.clientName}
              </p>
            </div>
          )}
        </section>
      )}

      {sortedDates.length === 0 && (
        <EmptyAgenda slug={professional.slug} hasHistory={hasAnyBookingEver} />
      )}

      {sortedDates.map((dateStr) => {
        const dayBookings = groups.get(dateStr)!;
        const confirmedFuture = dayBookings.filter(
          (b) => b.status === "CONFIRMED" && dateStr >= now.dateStr
        ).length;
        const isToday = dateStr === now.dateStr;

        return (
          <section key={dateStr} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-semibold capitalize font-display text-lg">
                {formatDateLong(dateStr)}
                {isToday && (
                  <span className="ml-2 text-xs font-sans font-medium bg-brand text-brand-foreground rounded-full px-2 py-0.5 align-middle">
                    Hoy
                  </span>
                )}
              </h2>
              {dateStr >= now.dateStr && (
                <CancelDayButton dateStr={dateStr} confirmedCount={confirmedFuture} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              {dayBookings.map((b) => {
                const { time } = wallClockOf(b.startTime);
                const isPast =
                  dateStr < now.dateStr ||
                  (dateStr === now.dateStr &&
                    b.startTime.getHours() * 60 + b.startTime.getMinutes() <= now.minutes);
                const data: BookingRowData = {
                  id: b.id,
                  time,
                  clientName: b.clientName,
                  clientPhone: b.clientPhone,
                  serviceName: b.service.name,
                  durationMin: b.service.durationMin,
                  status: b.status,
                  internalNote: b.internalNote,
                  intakeNote: b.intakeNote,
                  customAnswers: Array.isArray(b.customAnswers)
                    ? (b.customAnswers as unknown as { label: string; value: string }[])
                    : null,
                  visitCount: visitCountByPhone.get(b.clientPhone) ?? 1,
                  historyLabel,
                  isPast,
                  reminderSent: !!b.reminderSentAt,
                  hasClientEmail: !!b.clientEmail,
                };
                return (
                  <BookingRow key={b.id} booking={data} isNext={nextBooking?.id === b.id} />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
