import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createService, deleteService } from "@/lib/actions/services";

export default async function ServiciosPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  const services = await prisma.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-xl font-semibold">Servicios</h1>

      <form action={createService} className="flex flex-col gap-3 border rounded-md p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre del servicio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej: Corte de pelo"
            className="border rounded-md px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="durationMin" className="text-sm font-medium">
            Duración (minutos)
          </label>
          <input
            id="durationMin"
            name="durationMin"
            type="number"
            min={5}
            step={5}
            required
            placeholder="30"
            className="border rounded-md px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium">
            Precio (opcional)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            placeholder="Ej: 10000"
            className="border rounded-md px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-black text-white rounded-md px-4 py-2 font-medium"
        >
          Agregar servicio
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {services.length === 0 && (
          <p className="text-sm text-gray-500">Aún no tienes servicios.</p>
        )}
        {services.map((service) => (
          <li
            key={service.id}
            className="flex items-center justify-between border rounded-md px-3 py-2"
          >
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-xs text-gray-500">
                {service.durationMin} min
                {service.price ? ` · $${service.price}` : ""}
              </p>
            </div>
            <form action={deleteService.bind(null, service.id)}>
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
