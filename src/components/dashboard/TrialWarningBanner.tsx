"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const REPEAT_MS = 12 * 60 * 60 * 1000; // 12 horas

export function TrialWarningBanner({
  professionalId,
  daysLeft,
}: {
  professionalId: string;
  daysLeft: number;
}) {
  const storageKey = `trialBannerDismissedAt_${professionalId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(storageKey) || 0);
    setVisible(Date.now() - dismissedAt >= REPEAT_MS);
  }, [storageKey]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(storageKey, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40">
      <div className="bg-warning-soft border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)] flex items-start gap-3">
        <span aria-hidden className="text-lg shrink-0">⏳</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-warning">
            {daysLeft <= 0
              ? "Tu prueba gratis termina hoy"
              : `Te ${daysLeft === 1 ? "queda" : "quedan"} ${daysLeft} día${daysLeft === 1 ? "" : "s"} de prueba gratis`}
          </p>
          <p className="text-sm text-ink mt-1">
            Suscríbete para no perder acceso a tu panel. Tu página pública sigue
            funcionando igual para tus clientes.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/dashboard/suscripcion"
              className="text-sm font-semibold bg-brand text-brand-foreground rounded-lg px-3.5 py-2 shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)]"
            >
              Suscribirme ahora
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-medium text-stone hover:text-ink"
            >
              Recordar en 12 h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
