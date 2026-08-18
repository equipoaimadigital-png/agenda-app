import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // El manifest/ícono por negocio se sirve para el navegador del cliente
        // final (PWA "Agregar a inicio"), así que no lleva X-Frame-Options.
        source: "/((?!api/manifest|api/pwa-icon).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// withSentryConfig sube source maps al buildear (deja los stack traces
// legibles en Sentry en vez de código minificado) — solo se activa si existe
// SENTRY_AUTH_TOKEN; sin él, hace build normal y Sentry sigue capturando
// errores igual, solo sin el detalle extra del source map.
export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: false,
});
