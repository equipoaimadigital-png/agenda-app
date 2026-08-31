import type { Professional } from "@prisma/client";
import { buildWhatsappLink } from "@/lib/whatsapp";
import type { CampaignBranding } from "@/lib/email";

/**
 * Identidad de marca del negocio para el correo de campaña: sale toda de la
 * fila del profesional (portada + color + redes), nada nuevo que pedirle.
 * Vive en un módulo aparte (no "use server") para poder compartirla entre
 * las Server Actions de campañas y de reactivación.
 */
export function campaignBranding(
  professional: Professional,
  includeCover: boolean
): CampaignBranding {
  return {
    businessName: professional.businessName,
    tagline: professional.description,
    brandColor: professional.brandColor,
    coverImageUrl: professional.coverImageUrl,
    includeCover,
    bookingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/reservar/${professional.slug}`,
    instagramUrl: professional.instagramUrl,
    facebookUrl: professional.facebookUrl,
    whatsappUrl: professional.phone
      ? buildWhatsappLink(
          professional.phone,
          `Hola, quiero reservar una hora en ${professional.businessName}.`
        )
      : null,
    mapsUrl: professional.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.address)}`
      : null,
  };
}
