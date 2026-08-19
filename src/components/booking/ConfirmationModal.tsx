"use client";

import { useEffect } from "react";
import { formatDateLong } from "@/lib/dates";

export function ConfirmationModal({
  serviceName,
  dateStr,
  time,
  onClose,
}: {
  serviceName: string;
  dateStr: string;
  time: string;
  onClose: () => void;
}) {
  // Auto-cierre después de 5 segundos si el usuario no interactúa
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Bloquea scroll del fondo
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full shadow-lg border border-border">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-brand mb-2">
            Reserva confirmada
          </h2>
          <div className="space-y-3 mb-6 text-sm">
            <p className="text-stone">
              <strong className="text-base">{serviceName}</strong>
            </p>
            <p className="text-muted">
              {formatDateLong(dateStr)} a las {time}
            </p>
            <p className="text-xs text-stone mt-4">
              Revisa tu email y SMS para confirmación y recordatorios.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-brand text-white font-medium py-3 rounded-lg hover:bg-brand/90 active:scale-95 transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
