import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { nowInTimeZone, weekdayOf } from "@/lib/dates";
import { buildWhatsappLink } from "@/lib/whatsapp";

const HERO_VERB = "Reserva tu hora";

type PageProps = { params: Promise<{ slug: string }> };

async function loadProfessional(slug: string) {
  return prisma.professional.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: { createdAt: "asc" } } },
  });
}

/** ¿Algún Staff activo tiene un bloque de disponibilidad que cubre el momento actual? */
async function isOpenNow(professionalId: string, timezone: string): Promise<boolean> {
  const now = nowInTimeZone(timezone);
  const weekday = weekdayOf(now.dateStr);

  const staff = await prisma.staff.findMany({
    where: { professionalId, active: true },
    include: {
      availability: { where: { weekday } },
      dateExceptions: { where: { date: now.dateStr } },
    },
  });

  return staff.some(
    (s) =>
      s.dateExceptions.length === 0 &&
      s.availability.some((b) => now.minutes >= b.startMinutes && now.minutes < b.endMinutes)
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await loadProfessional(slug);
  if (!professional) return { title: "Página no encontrada" };
  return {
    title: `${HERO_VERB} con ${professional.businessName}`,
    description:
      professional.description ??
      `Agenda online de ${professional.businessName}. Elige un servicio y reserva en segundos.`,
    // Permite "Agregar a inicio" en el celular: queda como una app con el
    // ícono y color del negocio, sin pasar por App Store ni Google Play.
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: professional.businessName,
    },
    icons: {
      icon: `/api/pwa-icon/${slug}`,
      apple: `/api/pwa-icon/${slug}`,
    },
    manifest: `/api/manifest/${slug}`,
  };
}

export async function generateViewport({ params }: PageProps) {
  const { slug } = await params;
  const professional = await loadProfessional(slug);
  return { themeColor: professional?.brandColor ?? "#2f4a3e" };
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

  const openNow = await isOpenNow(professional.id, professional.timezone);

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
      ...(s.priceType === "FIXED" && s.price
        ? { price: s.price, priceCurrency: "CLP" }
        : {}),
    })),
  };

  return (
    <main
      className="min-h-screen bg-paper"
      style={{ "--brand": professional.brandColor } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        // El negocio controla businessName/description/servicios — sin este escape,
        // un texto con "</script>" cerraría la etiqueta y permitiría inyectar HTML/JS
        // que corre en el navegador de cada cliente que visita esta página (XSS).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero del negocio — el nombre es lo primero que se lee */}
      <header className="relative bg-ink text-white overflow-hidden">
        {professional.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={professional.coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-ink/70" />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 seal-texture" />
        )}
        <div className="relative max-w-lg mx-auto px-5 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex items-start gap-4">
            <div
              aria-hidden
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand flex items-center justify-center text-lg sm:text-xl font-semibold shrink-0 ring-2 ring-white/15"
            >
              {professional.businessName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-xs uppercase tracking-wide text-white/60">{HERO_VERB}</p>
                <span
                  className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                    openNow ? "bg-success/20 text-success" : "bg-white/10 text-white/60"
                  }`}
                >
                  {openNow ? "● Abierto ahora" : "Cerrado ahora"}
                </span>
              </div>
              <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight tracking-tight">
                {professional.businessName}
              </h1>
              {professional.address && (
                <p className="text-sm text-white/70 mt-1">{professional.address}</p>
              )}
              {(professional.address || professional.phone) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {professional.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        professional.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-white/10 hover:bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-1"
                    >
                      📍 Ver en Google Maps
                    </a>
                  )}
                  {professional.phone && (
                    <a
                      href={buildWhatsappLink(
                        professional.phone,
                        `Hola, vi tu página de reservas (${professional.businessName}) y quería consultar.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-success/20 hover:bg-success/30 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
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
            services={professional.services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              durationMin: s.durationMin,
              price: s.price,
              priceType: s.priceType,
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
