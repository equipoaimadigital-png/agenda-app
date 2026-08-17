"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelDayEmergency } from "@/lib/actions/dashboard";

export function CancelDayButton({ dateStr, confirmedCount }: { dateStr: string; confirmedCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (confirmedCount === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-danger hover:underline self-start"
        >
          Cancelar todo el día (emergencia)
        </button>
      ) : (
        <div className="bg-danger-soft border border-border rounded-xl p-3 flex flex-col gap-2">
          <p className="text-sm">
            Se cancelarán <strong>{confirmedCount}</strong> cita(s) de este día, se avisará a
            cada cliente por email y el día quedará bloqueado para nuevas reservas.
          </p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (se incluye en el aviso al cliente)"
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await cancelDayEmergency(dateStr, reason);
                  setOpen(false);
                  router.refresh();
                })
              }
              className="bg-danger text-white rounded-lg px-3 py-1.5 text-sm font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
            >
              {isPending ? "Cancelando…" : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-border bg-surface rounded-lg px-3 py-1.5 text-sm active:scale-[0.97]"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
