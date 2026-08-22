import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDateLong, toDateStr } from "@/lib/dates";
import {
  computeBusinessThresholds,
  computeClientSegment,
  intervalsBetweenVisits,
  SEGMENT_BADGE_CLASSES,
  SEGMENT_LABEL,
} from "@/lib/segments";

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatBirthday(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export default async function ClientesPage() {
  const professional = await requireDashboardAccess();
  const now = new Date();
  const todayMMDD = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate()).slice(5);

  const clients = await prisma.client.findMany({
    where: { professionalId: professional.id },
    include: {
      // Todas las reservas: se separan en "visitas reales" (ya pasadas,
      // confirmadas/completadas) vs. próximas más abajo. Un cliente con solo
      // una cita futura sigue siendo un cliente — no debe desaparecer de la
      // lista solo porque todavía no ha visitado.
      bookings: {
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        select: { startTime: true },
        orderBy: { startTime: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Umbral de "frecuente"/"en riesgo" propio de este negocio, calculado sobre
  // TODOS los intervalos entre visitas reales de TODOS sus clientes.
  const allIntervals = clients.flatMap((c) =>
    intervalsBetweenVisits(c.bookings.map((b) => b.startTime).filter((d) => d <= now))
  );
  const thresholds = computeBusinessThresholds(allIntervals);

  const rows = clients
    .map((c) => {
      const pastVisits = c.bookings.map((b) => b.startTime).filter((d) => d <= now);
      const nextBooking = c.bookings
        .map((b) => b.startTime)
        .filter((d) => d > now)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
      return {
        id: c.id,
        name: c.name ?? c.phone,
        phone: c.phone,
        email: c.email,
        birthday: c.birthday,
        visits: pastVisits.length,
        lastVisit: pastVisits[0] ?? null,
        nextBooking,
        segment: computeClientSegment(pastVisits, now, thresholds),
      };
    })
    .sort((a, b) => {
      const aDate = a.lastVisit ?? a.nextBooking ?? new Date(0);
      const bDate = b.lastVisit ?? b.nextBooking ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

  const birthdayToday = rows.filter((r) => r.birthday === todayMMDD);
  const atRisk = rows.filter((r) => r.segment === "EN_RIESGO");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Clientes</h1>
        <p className="text-sm text-stone mt-1">
          Todas las personas que han reservado contigo — {rows.length} en total.
        </p>
      </div>

      {birthdayToday.length > 0 && (
        <section className="bg-warning-soft border border-border rounded-xl p-4">
          <p className="text-xs text-stone uppercase tracking-wide mb-1">🎂 Cumpleaños de hoy</p>
          <p className="font-medium">
            {birthdayToday.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/dashboard/clientes/${c.id}`} className="underline">{c.name}</Link>
              </span>
            ))}
          </p>
        </section>
      )}

      {atRisk.length > 0 && (
        <section className="bg-danger-soft border border-border rounded-xl p-4">
          <p className="text-xs text-stone uppercase tracking-wide mb-1">⚠️ En riesgo de fuga</p>
          <p className="text-sm mb-1">
            Eran clientes frecuentes y no vuelven hace rato — vale la pena contactarlos antes de perderlos.
          </p>
          <p className="font-medium">
            {atRisk.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/dashboard/clientes/${c.id}`} className="underline">{c.name}</Link>
              </span>
            ))}
          </p>
        </section>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Todavía no tienes clientes.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/dashboard/clientes/${row.id}`}
              className={`bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-brand active:scale-[0.99] ${
                !row.nextBooking ? "opacity-60 grayscale hover:opacity-80" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{row.name}</p>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${SEGMENT_BADGE_CLASSES[row.segment]}`}>
                    {SEGMENT_LABEL[row.segment]}
                  </span>
                </div>
                <p className="text-sm text-stone">
                  {row.phone}
                  {row.email && <> · {row.email}</>}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {row.visits} visita{row.visits === 1 ? "" : "s"}
                  {row.lastVisit && (
                    <>
                      {" "}
                      · última el{" "}
                      <span className="capitalize">
                        {formatDateLong(toDateStr(row.lastVisit.getFullYear(), row.lastVisit.getMonth() + 1, row.lastVisit.getDate()))}
                      </span>
                    </>
                  )}
                  {!row.lastVisit && row.nextBooking && (
                    <>
                      {" "}
                      · próxima cita el{" "}
                      <span className="capitalize">
                        {formatDateLong(toDateStr(row.nextBooking.getFullYear(), row.nextBooking.getMonth() + 1, row.nextBooking.getDate()))}
                      </span>
                    </>
                  )}
                  {row.birthday && <> · 🎂 {formatBirthday(row.birthday)}</>}
                </p>
              </div>
              <span className="text-sm text-stone shrink-0">Ver ficha →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
