import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { saveClientBirthday } from "@/lib/actions/clients";
import { formatDateLong, toDateStr } from "@/lib/dates";

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

  const [bookings, clients] = await Promise.all([
    prisma.booking.findMany({
      where: { professionalId: professional.id },
      orderBy: { startTime: "desc" },
      select: { clientName: true, clientPhone: true, clientEmail: true, startTime: true },
    }),
    prisma.client.findMany({ where: { professionalId: professional.id } }),
  ]);

  const birthdayByPhone = new Map(clients.map((c) => [c.phone, c.birthday]));

  type Row = {
    phone: string;
    name: string;
    email: string | null;
    visits: number;
    lastVisit: Date;
  };
  const byPhone = new Map<string, Row>();
  for (const b of bookings) {
    const existing = byPhone.get(b.clientPhone);
    if (existing) {
      existing.visits += 1;
    } else {
      byPhone.set(b.clientPhone, {
        phone: b.clientPhone,
        name: b.clientName,
        email: b.clientEmail,
        visits: 1,
        lastVisit: b.startTime,
      });
    }
  }
  const rows = [...byPhone.values()];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Clientes</h1>
        <p className="text-sm text-stone mt-1">
          Todas las personas que han reservado contigo — {rows.length} en total.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Todavía no tienes clientes.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const birthday = birthdayByPhone.get(row.phone) ?? null;
            const dateStr = toDateStr(
              row.lastVisit.getFullYear(),
              row.lastVisit.getMonth() + 1,
              row.lastVisit.getDate()
            );
            return (
              <div
                key={row.phone}
                className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.name}</p>
                  <p className="text-sm text-stone">
                    <a href={`tel:${row.phone}`} className="underline decoration-border hover:decoration-brand">
                      {row.phone}
                    </a>
                    {row.email && <> · {row.email}</>}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {row.visits} visita{row.visits === 1 ? "" : "s"} · última el{" "}
                    <span className="capitalize">{formatDateLong(dateStr)}</span>
                    {birthday && <> · 🎂 {formatBirthday(birthday)}</>}
                  </p>
                </div>

                <form action={saveClientBirthday} className="flex items-center gap-2 shrink-0">
                  <input type="hidden" name="phone" value={row.phone} />
                  <label htmlFor={`bday-day-${row.phone}`} className="text-xs text-muted">
                    Cumpleaños
                  </label>
                  <select
                    id={`bday-day-${row.phone}`}
                    name="day"
                    defaultValue={birthday ? Number(birthday.split("-")[1]) : ""}
                    className="border border-border rounded-lg px-2 py-1.5 text-sm bg-surface"
                  >
                    <option value="">Día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    name="month"
                    defaultValue={birthday ? Number(birthday.split("-")[0]) : ""}
                    className="border border-border rounded-lg px-2 py-1.5 text-sm bg-surface"
                  >
                    <option value="">Mes</option>
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
                  >
                    Guardar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
