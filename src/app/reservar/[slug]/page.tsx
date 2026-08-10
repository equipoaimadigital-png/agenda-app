import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { industryPreset } from "@/lib/industries";

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
  const heroVerb = industryPreset(professional.industry).heroVerb;
  return {
    title: `${heroVerb} con ${professional.businessName}`,
    description:
      professional.description ??
      `Agenda online de ${professional.businessName}. Elige un servicio y reserva en segundos.`,
  };
}

const TRUST_ITEMS = [
  { icon: "⚡", text: "Confirmación al instante" },
  { icon: "↺", text: "Cancela gratis con anticipación" },
  { icon: "🔒", text: "Tus datos están protegidos" },
];

export default async function ReservarPage({ params }: PageProps) {
  const { slug } = await params;
  const professional = await loadProfessional(slug);

  if (!professional) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center bg-paper">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold font-display">Página no disponible</h1>
          <p className="text-stone mt-2">
            Este enlace no existe o ya no está activo. Verifica el enlace con
            quien te lo compartió.
          </p>
        </div>
      </main>
    );
  }

  const heroVerb = industryPreset(professional.industry).heroVerb;

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
      className="min-h-screen bg-paper"
      style={{ "--brand": professional.brandColor } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero del negocio — el nombre es lo primero que se lee */}
      <header className="relative bg-ink text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 seal-texture" />
        <div className="relative max-w-lg mx-auto px-5 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex items-start gap-4">
            <div
              aria-hidden
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand flex items-center justify-center text-lg sm:text-xl font-semibold shrink-0 ring-2 ring-white/15"
            >
              {professional.businessName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-white/60 mb-0.5">{heroVerb}</p>
              <h1 className="font-display text-2xl sm:text-3xl leading-tight">
                {professional.businessName}
              </h1>
              {professional.address && (
                <p className="text-sm text-white/70 mt-1">{professional.address}</p>
              )}
            </div>
          </div>
          {professional.description && (
            <p className="text-white/80 mt-4 text-sm sm:text-base max-w-md">
              {professional.description}
            </p>
          )}
        </div>
      </header>

      {/* Franja de confianza */}
      <div className="bg-brand-soft border-b border-border">
        <ul className="max-w-lg mx-auto px-5 py-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-sm text-ink">
          {TRUST_ITEMS.map((item) => (
            <li key={item.text} className="flex items-center gap-1.5">
              <span aria-hidden>{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 pb-16">
        {professional.services.length === 0 ? (
          <p className="text-stone">
            Este negocio todavía no tiene servicios disponibles para reservar.
          </p>
        ) : (
          <BookingWidget
            slug={professional.slug}
            intakeField={industryPreset(professional.industry).intakeField}
            services={professional.services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              durationMin: s.durationMin,
              price: s.price,
            }))}
          />
        )}
        <p className="text-xs text-stone text-center mt-10">
          Cancelaciones y cambios hasta {professional.cancellationHours} h antes de la cita.
        </p>
      </div>
    </main>
  );
}
