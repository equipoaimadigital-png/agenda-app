import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
  // No adjuntar IP, cookies ni cuerpo de request a los eventos: manejamos
  // datos de clientes (nombre, teléfono) y la app opera bajo la Ley 21.719.
  sendDefaultPii: false,
});
