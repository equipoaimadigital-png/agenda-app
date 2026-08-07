"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingByToken, rescheduleBookingByToken } from "@/lib/actions/manage-booking";
import { DateTimePicker } from "@/components/booking/DateTimePicker";

type Props = {
  token: string;
  slug: string;
  serviceId: string;
  canModify: boolean;
  cancellationHours: number;
};

export function ManageBookingActions({ token, slug, serviceId, canModify, cancellationHours }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"none" | "reschedule" | "confirm-cancel">("none");
  const [picked, setPicked] = useState<{ dateStr: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canModify) {
    return (
      <p className="text-sm text-muted bg-warning-soft border border-border rounded-xl px-4 py-3">
        El plazo para cancelar o reprogramar en línea ya pasó (hasta {cancellationHours} h
        antes de la cita). Si tienes un imprevisto, contacta directamente al negocio.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "none" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="border border-border bg-surface rounded-lg px-4 py-2.5 text-sm font-medium hover:border-brand"
          >
            Reprogramar
          </button>
          <button
            type="button"
            onClick={() => setMode("confirm-cancel")}
            className="border border-border bg-surface rounded-lg px-4 py-2.5 text-sm font-medium text-danger hover:border-danger"
          >
            Cancelar cita
          </button>
        </div>
      )}

      {mode === "confirm-cancel" && (
        <div className="bg-danger-soft border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm">¿Seguro que quieres cancelar esta cita?</p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelBookingByToken(token);
                  if (result.error) setError(result.error);
                  else router.refresh();
                })
              }
              className="bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Cancelando…" : "Sí, cancelar"}
            </button>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="border border-border bg-surface rounded-lg px-4 py-2 text-sm"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Elige el nuevo horario:</p>
          <DateTimePicker
            slug={slug}
            serviceId={serviceId}
            picked={picked}
            onPick={(dateStr, time) => setPicked({ dateStr, time })}
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!picked || isPending}
              onClick={() => {
                if (!picked) return;
                startTransition(async () => {
                  const result = await rescheduleBookingByToken(token, picked.dateStr, picked.time);
                  if (result.error) setError(result.error);
                  else {
                    setMode("none");
                    setPicked(null);
                    router.refresh();
                  }
                });
              }}
              className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Reprogramando…" : "Confirmar nuevo horario"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("none");
                setPicked(null);
              }}
              className="border border-border bg-surface rounded-lg px-4 py-2.5 text-sm"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
