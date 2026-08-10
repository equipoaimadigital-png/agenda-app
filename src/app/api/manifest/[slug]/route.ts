import { prisma } from "@/lib/db";

/**
 * Manifest de PWA por negocio. No se puede usar la convención de archivo
 * manifest.ts dentro de una ruta dinámica ([slug]) — Next.js solo la
 * reconoce en la raíz — así que se sirve a mano desde una API route y se
 * referencia con `metadata.manifest` en la página de reserva.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const professional = await prisma.professional.findUnique({
    where: { slug },
    select: { businessName: true, brandColor: true, description: true },
  });

  const name = professional?.businessName ?? "Tú Agenda";

  const manifest = {
    name,
    short_name: name.slice(0, 12),
    description: professional?.description ?? `Reserva tu hora con ${name}.`,
    start_url: `/reservar/${slug}`,
    scope: `/reservar/${slug}`,
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: professional?.brandColor ?? "#2f4a3e",
    icons: [
      { src: `/api/pwa-icon/${slug}`, sizes: "192x192", type: "image/png" },
      { src: `/api/pwa-icon/${slug}`, sizes: "512x512", type: "image/png" },
    ],
  };

  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
