import { requireDashboardAccess, getPrimaryStaffId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createAvailability, deleteAvailability } from "@/lib/actions/availability";
import { addDateException, deleteDateException } from "@/lib/actions/dashboard";
import { formatDateLong, minutesToTime } from "@/lib/dates";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Orden visual: semana empieza en lunes
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

export default async function DisponibilidadPage() {
  const professional = await requireDashboardAccess();
  const staffId = await getPrimaryStaffId(professional.id);

  const [blocks, exceptions] = staffId
    ? await Promise.all([
        prisma.availability.findMany({
          where: { staffId },
          orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
        }),
        prisma.dateException.findMany({
          where: { staffId },
          orderBy: { date: "asc" },
        }),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Disponibilidad</h1>
        <p className="text-sm text-muted mt-1">
          Tu horario semanal recurrente y los días puntuales sin atención.
        </p>
      </div>

      {/* Horario semanal */}
      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Horario semanal</h2>
        <form
          action={createAvailability}
          className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">
              Días (puedes marcar varios a la vez)
            </legend>
            <div className="flex flex-wrap gap-2">
              {ORDEN.map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm cursor-pointer has-checked:bg-brand-soft has-checked:border-brand"
                >
                  <input type="checkbox" name="weekday" value={d} className="accent-(--brand)" />
                  {DIAS[d]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="startTime" className="text-sm font-medium">Desde</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                required
                className="border border-border rounded-lg px-3 py-2.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endTime" className="text-sm font-medium">Hasta</label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                required
                className="border border-border rounded-lg px-3 py-2.5"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
          >
            Agregar bloque
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {blocks.length === 0 && (
            <p className="text-sm text-muted">
              Aún no tienes horario definido — tus clientes no verán cupos hasta que
              agregues al menos un bloque.
            </p>
          )}
          {ORDEN.filter((d) => blocks.some((b) => b.weekday === d)).map((d) => (
            <li key={d} className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="font-medium mb-1">{DIAS[d]}</p>
              <div className="flex flex-wrap gap-2">
                {blocks
                  .filter((b) => b.weekday === d)
                  .map((block) => (
                    <form
                      key={block.id}
                      action={deleteAvailability.bind(null, block.id)}
                      className="flex items-center gap-2 bg-brand-soft rounded-lg px-3 py-1.5 text-sm"
                    >
                      {minutesToTime(block.startMinutes)}–{minutesToTime(block.endMinutes)}
                      <button
                        type="submit"
                        aria-label="Eliminar bloque"
                        className="text-danger font-medium hover:opacity-70 active:scale-[0.9]"
                      >
                        ×
                      </button>
                    </form>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Días bloqueados */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">Días sin atención</h2>
          <p className="text-sm text-muted">
            Feriados, vacaciones o cualquier día puntual en que no atenderás.
          </p>
        </div>
        <form
          action={addDateException}
          className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="exc-date" className="text-sm font-medium">Fecha</label>
              <input
                id="exc-date"
                name="date"
                type="date"
                required
                className="border border-border rounded-lg px-3 py-2.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="exc-reason" className="text-sm font-medium">
                Motivo <span className="text-muted font-normal">(opcional)</span>
              </label>
              <input
                id="exc-reason"
                name="reason"
                type="text"
                placeholder="Ej: Vacaciones"
                className="border border-border rounded-lg px-3 py-2.5"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
          >
            Bloquear día
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {exceptions.length === 0 && (
            <p className="text-sm text-muted">No tienes días bloqueados.</p>
          )}
          {exceptions.map((exc) => (
            <li
              key={exc.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium capitalize">{formatDateLong(exc.date)}</p>
                {exc.reason && <p className="text-sm text-muted">{exc.reason}</p>}
              </div>
              <form action={deleteDateException.bind(null, exc.id)}>
                <button
                  type="submit"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
                >
                  Quitar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
