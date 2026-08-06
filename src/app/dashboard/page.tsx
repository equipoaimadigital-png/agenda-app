import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const professional = await getCurrentProfessional();
  if (!professional) {
    return <p className="text-sm text-red-600">No se encontró tu perfil de profesional.</p>;
  }

  const bookings = await prisma.booking.findMany({
    where: { professionalId: professional.id, status: "CONFIRMED" },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Próximas citas</h1>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">
          Todavía no tienes citas. Comparte tu link de reserva para empezar a
          recibirlas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bookings.map((b) => (
            <li key={b.id} className="border rounded-md px-3 py-2">
              <p className="font-medium">
                {b.clientName} · {b.service.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatDateTime(b.startTime)} · {b.clientPhone}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
