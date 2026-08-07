import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { BookingRow, type BookingRowData } from "@/components/dashboard/BookingRow";
import { CancelDayButton } from "@/components/dashboard/CancelDayButton";
import { formatDateLong, nowInTimeZone, wallClockOf } from "@/lib/dates";

export default async function AgendaPage() {
  const professional = await getCurrentProfessional();
  if (!professional) {
    return <p className="text-sm text-danger">No se encontró tu perfil de profesional.</p>;
  }

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
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted mt-1">
          Tus citas de los últimos 7 días y las próximas.
        </p>
      </div>

      {sortedDates.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="font-medium">Todavía no tienes citas</p>
          <p className="text-sm text-muted mt-1">
            Comparte tu link de reserva (en la barra lateral) para empezar a recibirlas.
          </p>
        </div>
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
              <h2 className="font-semibold capitalize">
                {formatDateLong(dateStr)}
                {isToday && (
                  <span className="ml-2 text-xs font-medium bg-brand text-brand-foreground rounded-full px-2 py-0.5">
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
                  isPast,
                };
                return <BookingRow key={b.id} booking={data} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
