"use client";

import Link from "next/link";
import { useState } from "react";

const REPEAT_MS = 6 * 60 * 60 * 1000; // 6 horas — más insistente que el de prueba

/**
 * Aviso de cobro recurrente fallido. Se muestra durante el período de
 * gracia; después el panel se bloquea y la propia página de Suscripción
 * explica la situación.
 */
export function PaymentIssueBanner({
  professionalId,
  graceDaysLeft,
}: {
  professionalId: string;
  graceDaysLeft: number;
}) {
  const storageKey = `paymentIssueBannerDismissedAt_${professionalId}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const dismissedAt = Number(localStorage.getItem(storageKey) || 0);
      return Date.now() - dismissedAt >= REPEAT_MS;
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      /* modo privado / storage bloqueado — igual lo ocultamos en memoria */
    }
    setVisible(false);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40">
      <div className="bg-danger-soft border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)] flex items-start gap-3">
        <span aria-hidden className="text-lg shrink-0">⚠️</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-danger">
            No pudimos cobrar tu suscripción
          </p>
          <p className="text-sm text-ink mt-1">
            {graceDaysLeft <= 0
              ? "Tu panel se bloqueará muy pronto. "
              : `Te ${graceDaysLeft === 1 ? "queda" : "quedan"} ${graceDaysLeft} día${
                  graceDaysLeft === 1 ? "" : "s"
                } antes de que se bloquee el panel. `}
            Actualiza tu medio de pago en Mercado Pago o paga un mes ahora. Tu página pública
            sigue funcionando para tus clientes.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/dashboard/suscripcion"
              className="text-sm font-semibold bg-brand text-brand-foreground rounded-lg px-3.5 py-2 shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_rgba(0,0,0,0.14)] active:translate-y-[1px]"
            >
              Solucionar el pago
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-medium text-stone hover:text-ink active:scale-[0.97]"
            >
              Recordar en 6 h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
