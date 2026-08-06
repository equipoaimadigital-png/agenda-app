import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createAvailability, deleteAvailability } from "@/lib/actions/availability";

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default async function DisponibilidadPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  const blocks = await prisma.availability.findMany({
    where: { professionalId: professional.id },
    orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-xl font-semibold">Disponibilidad semanal</h1>
      <p className="text-sm text-gray-500">
        Define los bloques de horario en los que tus clientes pueden reservar
        cada semana.
      </p>

      <form action={createAvailability} className="flex flex-col gap-3 border rounded-md p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="weekday" className="text-sm font-medium">
            Día
          </label>
          <select id="weekday" name="weekday" required className="border rounded-md px-3 py-2">
            {DIAS.map((dia, index) => (
              <option key={index} value={index}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="startTime" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              className="border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="endTime" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              className="border rounded-md px-3 py-2"
            />
          </div>
        </div>
        <button type="submit" className="bg-black text-white rounded-md px-4 py-2 font-medium">
          Agregar bloque
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {blocks.length === 0 && (
          <p className="text-sm text-gray-500">
            Aún no tienes bloques de disponibilidad.
          </p>
        )}
        {blocks.map((block) => (
          <li
            key={block.id}
            className="flex items-center justify-between border rounded-md px-3 py-2"
          >
            <p>
              {DIAS[block.weekday]}: {minutesToTime(block.startMinutes)} -{" "}
              {minutesToTime(block.endMinutes)}
            </p>
            <form action={deleteAvailability.bind(null, block.id)}>
              <button type="submit" className="text-sm text-red-600">
                Eliminar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
