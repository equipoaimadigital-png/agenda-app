"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelBookingByProfessional,
  markBookingStatus,
  saveInternalNote,
} from "@/lib/actions/dashboard";

export type BookingRowData = {
  id: string;
  time: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  durationMin: number;
  status: string;
  internalNote: string | null;
  /** true si la hora de la cita ya pasó */
  isPast: boolean;
};

const STATUS_BADGE: Record<string, { text: string; classes: string }> = {
  CONFIRMED: { text: "Confirmada", classes: "bg-success-soft text-success" },
  CANCELLED: { text: "Cancelada", classes: "bg-danger-soft text-danger" },
  COMPLETED: { text: "Completada", classes: "bg-brand-soft text-brand" },
  NO_SHOW: { text: "No asistió", classes: "bg-warning-soft text-warning" },
};

export function BookingRow({ booking }: { booking: BookingRowData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"none" | "cancel" | "note">("none");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(booking.internalNote ?? "");

  const badge = STATUS_BADGE[booking.status] ?? STATUS_BADGE.CONFIRMED;
  const cancelled = booking.status === "CANCELLED";

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      setPanel("none");
      router.refresh();
    });
  }

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 ${
        cancelled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-mono font-semibold text-lg leading-6">{booking.time}</span>
          <div className="min-w-0">
            <p className="font-medium truncate">{booking.clientName}</p>
            <p className="text-sm text-muted truncate">
              {booking.serviceName} · {booking.durationMin} min ·{" "}
              <a href={`tel:${booking.clientPhone}`} className="underline decoration-border hover:decoration-brand">
                {booking.clientPhone}
              </a>
            </p>
            {booking.internalNote && panel !== "note" && (
              <p className="text-xs text-muted mt-1 bg-warning-soft rounded px-2 py-1 inline-block">
                📝 {booking.internalNote}
              </p>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium rounded-full px-2.5 py-1 whitespace-nowrap ${badge.classes}`}>
          {badge.text}
        </span>
      </div>

      {booking.status === "CONFIRMED" && (
        <div className="flex flex-wrap gap-2 text-sm">
          {booking.isPast && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => markBookingStatus(booking.id, "COMPLETED"))}
                className="border border-border rounded-lg px-3 py-1.5 hover:border-success hover:text-success disabled:opacity-50"
              >
                ✓ Atendida
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => markBookingStatus(booking.id, "NO_SHOW"))}
                className="border border-border rounded-lg px-3 py-1.5 hover:border-warning hover:text-warning disabled:opacity-50"
              >
                No asistió
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setPanel(panel === "note" ? "none" : "note")}
            className="border border-border rounded-lg px-3 py-1.5 hover:border-brand"
          >
            Nota
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "cancel" ? "none" : "cancel")}
            className="border border-border rounded-lg px-3 py-1.5 text-danger hover:border-danger"
          >
            Cancelar
          </button>
        </div>
      )}

      {panel === "cancel" && (
        <div className="bg-danger-soft rounded-lg p-3 flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor={`reason-${booking.id}`}>
            Motivo (se le enviará al cliente por email):
          </label>
          <input
            id={`reason-${booking.id}`}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Imprevisto de salud, debemos reagendar"
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => cancelBookingByProfessional(booking.id, reason))}
              className="bg-danger text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Cancelando…" : "Confirmar cancelación"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="border border-border bg-surface rounded-lg px-3 py-1.5 text-sm"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {panel === "note" && (
        <div className="bg-warning-soft rounded-lg p-3 flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor={`note-${booking.id}`}>
            Nota interna (solo la ves tú):
          </label>
          <textarea
            id={`note-${booking.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ej: Prefiere corte con tijera, cliente frecuente"
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => saveInternalNote(booking.id, note))}
              className="bg-brand text-brand-foreground rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Guardar nota"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="border border-border bg-surface rounded-lg px-3 py-1.5 text-sm"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
