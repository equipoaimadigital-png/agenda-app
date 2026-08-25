"use client";

import { useState, useTransition } from "react";
import { startMercadoPagoConnect, disconnectMercadoPago } from "@/lib/actions/mercadopago-connect";

export function MercadoPagoConnectCard({
  connected,
  connectedAt,
  initialError,
}: {
  connected: boolean;
  connectedAt: Date | null;
  initialError?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    initialError ? "No se pudo completar la conexión con Mercado Pago. Intenta de nuevo." : null
  );

  function connect() {
    setError(null);
    startTransition(async () => {
      const result = await startMercadoPagoConnect();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) window.location.href = result.url;
    });
  }

  function disconnect() {
    startTransition(() => disconnectMercadoPago());
  }

  return (
    <section className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">Cobro de depósitos</h2>
        <p className="text-sm text-muted mt-1">
          Conecta tu propia cuenta de Mercado Pago para poder pedir depósito al reservar en los
          servicios que quieras. El dinero llega directo a tu cuenta — nunca pasa por nosotros.
        </p>
      </div>

      {connected ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium text-success bg-success-soft rounded-lg px-3 py-1.5">
            ✓ Cuenta conectada
            {connectedAt ? ` el ${connectedAt.toLocaleDateString("es-CL")}` : ""}
          </span>
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="text-sm text-danger hover:underline disabled:opacity-50"
          >
            {isPending ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={isPending}
          className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
        >
          {isPending ? "Conectando…" : "Conectar con Mercado Pago"}
        </button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
