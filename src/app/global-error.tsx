"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ background: "#f6f3ec", color: "#1b2420", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              maxWidth: "24rem",
              width: "100%",
              background: "#ffffff",
              border: "1px solid #e2ddd0",
              borderRadius: "16px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "1.875rem", marginBottom: "0.5rem" }}>⚠️</p>
            <h1 style={{ fontWeight: 600, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              Algo falló de nuestro lado
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b6459", marginBottom: "1.25rem" }}>
              Intenta de nuevo; si sigue pasando, escríbenos a soporte@tuhoralista.com.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#2f4a3e",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "0.625rem 1rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
