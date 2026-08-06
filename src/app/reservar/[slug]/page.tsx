import { prisma } from "@/lib/db";
import { BookingWidget } from "@/components/booking/BookingWidget";

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const professional = await prisma.professional.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!professional) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Formulario no disponible</h1>
          <p className="text-gray-500 mt-2 max-w-sm">
            Este enlace no existe o el formulario ya no está activo. Verifica
            el enlace con quien te lo compartió.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{professional.businessName}</h1>
          <p className="text-sm text-gray-500">Elige un servicio y un horario disponible.</p>
        </div>

        {professional.services.length === 0 ? (
          <p className="text-sm text-gray-500">
            Este negocio todavía no tiene servicios disponibles para reservar.
          </p>
        ) : (
          <BookingWidget
            slug={professional.slug}
            services={professional.services.map((s) => ({
              id: s.id,
              name: s.name,
              durationMin: s.durationMin,
              price: s.price,
            }))}
          />
        )}
      </div>
    </main>
  );
}
