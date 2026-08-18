import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Gratis hasta 5.000 eventos/mes — no capturar 100% del tráfico para no
  // gastar la cuota en sesiones normales sin errores.
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
