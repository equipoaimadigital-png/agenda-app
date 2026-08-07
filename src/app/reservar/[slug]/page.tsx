import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BookingWidget } from "@/components/booking/BookingWidget";

type PageProps = { params: Promise<{ slug: string }> };

async function loadProfessional(slug: string) {
  return prisma.professional.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: { createdAt: "asc" } } },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await loadProfessional(slug);
  if (!professional) return { title: "Página no encontrada" };
  return {
    title: `Reserva tu hora con ${professional.businessName}`,
    description:
      professional.description ??
      `Agenda online de ${professional.businessName}. Elige un servicio y reserva tu hora en segundos.`,
  };
}

export default async function ReservarPage({ params }: PageProps) {
  const { slug } = await params;
  const professional = await loadProfessional(slug);

  if (!professional) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">Página no disponible</h1>
          <p className="text-muted mt-2">
            Este enlace no existe o ya no está activo. Verifica el enlace con
            quien te lo compartió.
          </p>
        </div>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: professional.businessName,
    description: professional.description ?? undefined,
    address: professional.address ?? undefined,
    telephone: professional.phone ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/reservar/${professional.slug}`,
    makesOffer: professional.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.description ?? undefined },
      ...(s.price ? { price: s.price, priceCurrency: "CLP" } : {}),
    })),
  };

  return (
    <main
      className="min-h-screen"
      style={{ "--brand": professional.brandColor } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero del negocio */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-8">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="w-14 h-14 rounded-2xl bg-brand text-brand-foreground flex items-center justify-center text-xl font-semibold shrink-0"
            >
              {professional.businessName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-tight">
                {professional.businessName}
              </h1>
              {professional.address && (
                <p className="text-sm text-muted mt-0.5">{professional.address}</p>
              )}
            </div>
          </div>
          {professional.description && (
            <p className="text-muted mt-4">{professional.description}</p>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6 pb-16">
        {professional.services.length === 0 ? (
          <p className="text-muted">
            Este negocio todavía no tiene servicios disponibles para reservar.
          </p>
        ) : (
          <BookingWidget
            slug={professional.slug}
            services={professional.services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              durationMin: s.durationMin,
              price: s.price,
            }))}
          />
        )}
        <p className="text-xs text-muted text-center mt-10">
          Cancelaciones y cambios hasta {professional.cancellationHours} h antes de la cita.
        </p>
      </div>
    </main>
  );
}
