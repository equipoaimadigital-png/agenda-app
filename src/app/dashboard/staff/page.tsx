import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createStaff } from "@/lib/actions/staff";
import { StaffForm } from "@/components/dashboard/StaffForm";
import { StaffRow } from "@/components/dashboard/StaffRow";

export default async function StaffPage() {
  const professional = await requireDashboardAccess();

  const [staff, services] = await Promise.all([
    prisma.staff.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: "asc" },
      include: { services: { select: { id: true } } },
    }),
    prisma.service.findMany({
      where: { professionalId: professional.id, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Profesionales</h1>
        <p className="text-sm text-muted mt-1">
          Quién atiende en tu negocio y qué servicios puede realizar cada uno. Cada
          profesional tiene su propia agenda dentro de tu cuenta.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="font-medium mb-3">Agregar profesional</p>
        <StaffForm action={createStaff} services={services} submitLabel="Agregar profesional" />
      </div>

      <ul className="flex flex-col gap-2">
        {staff.map((s) => (
          <StaffRow
            key={s.id}
            staff={{
              id: s.id,
              name: s.name,
              color: s.color,
              active: s.active,
              serviceIds: s.services.map((sv) => sv.id),
            }}
            services={services}
          />
        ))}
      </ul>

      {services.length === 0 && (
        <p className="text-sm text-muted">
          Todavía no tienes servicios activos — agrega uno en Servicios para poder asignárselo
          a tus profesionales.
        </p>
      )}
    </div>
  );
}
