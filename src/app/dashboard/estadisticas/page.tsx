import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { wallClockOf, weekdayOf } from "@/lib/dates";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold font-numeric mt-1">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default async function EstadisticasPage() {
  const professional = await requireDashboardAccess();

  const since = new Date();
  since.setDate(since.getDate() - 28); // últimas 4 semanas

  const bookings = await prisma.booking.findMany({
    where: { professionalId: professional.id, createdAt: { gte: since } },
    include: { service: true },
  });

  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
  const noShow = bookings.filter((b) => b.status === "NO_SHOW").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;

  const revenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + (b.service.price ?? 0), 0);

  const cancellationRate = total > 0 ? Math.round(((cancelled + noShow) / total) * 100) : 0;

  const byService = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    byService.set(b.service.name, (byService.get(b.service.name) ?? 0) + 1);
  }
  const topServices = [...byService.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const perWeek = Math.round((total / 4) * 10) / 10;

  const online = bookings.filter((b) => b.source === "ONLINE").length;
  const manual = bookings.filter((b) => b.source === "MANUAL").length;
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;
  const manualPct = total > 0 ? 100 - onlinePct : 0;

  // Factor de ocupación por día de la semana (lunes a domingo)
  const nonCancelled = bookings.filter((b) => b.status !== "CANCELLED");
  const countByWeekday = [0, 0, 0, 0, 0, 0, 0]; // índice 0 = domingo, igual que weekdayOf
  for (const b of nonCancelled) {
    const { dateStr } = wallClockOf(b.startTime);
    countByWeekday[weekdayOf(dateStr)] += 1;
  }
  const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // empieza en lunes
  const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const maxWeekdayCount = Math.max(1, ...countByWeekday);

  // Recordatorios automáticos: cuántas citas con email ya recibieron su recordatorio
  const withEmail = bookings.filter((b) => !!b.clientEmail);
  const remindersSent = withEmail.filter((b) => !!b.reminderSentAt).length;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Estadísticas</h1>
        <p className="text-sm text-muted mt-1">Últimas 4 semanas.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Citas por semana" value={String(perWeek)} hint={`${total} en total`} />
        <StatCard
          label="Ingresos estimados"
          value={`$${revenue.toLocaleString("es-CL")}`}
          hint="Solo citas marcadas como atendidas"
        />
        <StatCard
          label="Cancelación / no-show"
          value={`${cancellationRate}%`}
          hint={`${cancelled} canceladas, ${noShow} no-show`}
        />
        <StatCard label="Pendientes" value={String(confirmed)} hint="Citas confirmadas a futuro o sin marcar" />
      </div>

      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Ocupación por día de la semana</h2>
        {total === 0 ? (
          <p className="text-sm text-muted">Todavía no hay suficientes datos.</p>
        ) : (
          <div className="flex items-end gap-2 h-28">
            {WEEKDAY_ORDER.map((weekday, i) => {
              const count = countByWeekday[weekday];
              const heightPct = Math.max((count / maxWeekdayCount) * 100, count > 0 ? 8 : 2);
              return (
                <div key={weekday} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs font-medium">{count > 0 ? count : ""}</span>
                  <div
                    className={`w-full rounded ${count > 0 ? "bg-brand" : "bg-border"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs text-muted">{WEEKDAY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Recordatorios por email</h2>
        {withEmail.length === 0 ? (
          <p className="text-sm text-muted">
            Ningún cliente de este período dejó su email, así que no aplica el recordatorio automático.
          </p>
        ) : (
          <>
            <div className="h-2 rounded-full overflow-hidden bg-border">
              <div
                className="bg-brand h-full"
                style={{ width: `${Math.round((remindersSent / withEmail.length) * 100)}%` }}
              />
            </div>
            <p className="text-sm mt-2">
              <span className="font-medium">{remindersSent}</span> de{" "}
              <span className="font-medium">{withEmail.length}</span> recordatorios enviados
              <span className="text-muted"> (el resto son citas cuyo día anterior aún no llega)</span>
            </p>
          </>
        )}
      </section>

      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Origen de las reservas</h2>
        {total === 0 ? (
          <p className="text-sm text-muted">Todavía no hay suficientes datos.</p>
        ) : (
          <>
            <div className="h-2 rounded-full overflow-hidden bg-border flex">
              <div className="bg-brand h-full" style={{ width: `${onlinePct}%` }} />
              <div className="bg-brass h-full" style={{ width: `${manualPct}%` }} />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>
                <span className="font-medium">{onlinePct}%</span>{" "}
                <span className="text-muted">Online ({online})</span>
              </span>
              <span>
                <span className="font-medium">{manualPct}%</span>{" "}
                <span className="text-muted">Manual ({manual})</span>
              </span>
            </div>
          </>
        )}
      </section>

      <section className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Servicios más solicitados</h2>
        {topServices.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay suficientes datos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topServices.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span>{name}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {completed > 0 && (
        <p className="text-xs text-muted">
          {completed} cita(s) marcadas como atendidas en este período.
        </p>
      )}
    </div>
  );
}
