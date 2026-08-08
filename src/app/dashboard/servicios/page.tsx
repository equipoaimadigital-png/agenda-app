import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createService, deleteService, toggleServiceActive } from "@/lib/actions/services";

export default async function ServiciosPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  const services = await prisma.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Servicios</h1>
        <p className="text-sm text-muted mt-1">
          Lo que tus clientes pueden reservar. La descripción y el precio se muestran
          en tu página pública.
        </p>
      </div>

      <form
        action={createService}
        className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">Nombre del servicio *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej: Corte de pelo"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción <span className="text-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Ej: Incluye lavado y peinado"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="durationMin" className="text-sm font-medium">Duración (min) *</label>
            <input
              id="durationMin"
              name="durationMin"
              type="number"
              min={5}
              step={5}
              required
              placeholder="30"
              className="border border-border rounded-lg px-3 py-2.5"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="price" className="text-sm font-medium">Precio (CLP)</label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              placeholder="10000"
              className="border border-border rounded-lg px-3 py-2.5"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium"
        >
          Agregar servicio
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {services.length === 0 && (
          <p className="text-sm text-muted">Aún no tienes servicios.</p>
        )}
        {services.map((service) => (
          <li
            key={service.id}
            className={`bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
              service.active ? "" : "opacity-60"
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium">
                {service.name}
                {!service.active && (
                  <span className="ml-2 text-xs bg-warning-soft text-warning rounded-full px-2 py-0.5">
                    Pausado
                  </span>
                )}
              </p>
              <p className="text-sm text-muted">
                {service.durationMin} min
                {service.price ? ` · $${service.price.toLocaleString("es-CL")}` : ""}
              </p>
              {service.description && (
                <p className="text-sm text-muted mt-0.5">{service.description}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <form action={toggleServiceActive.bind(null, service.id)}>
                <button
                  type="submit"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand"
                >
                  {service.active ? "Pausar" : "Activar"}
                </button>
              </form>
              <form action={deleteService.bind(null, service.id)}>
                <button
                  type="submit"
                  className="text-sm border border-border rounded-lg px-3 py-1.5 text-danger hover:border-danger"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
