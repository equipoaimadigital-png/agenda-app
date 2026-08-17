"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createManualBooking } from "@/lib/actions/bookings";

type Service = { id: string; name: string; durationMin: number };
type StaffOption = { id: string; name: string };

export function NewBookingForm({
  services,
  staff,
}: {
  services: Service[];
  staff: StaffOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    async (_prev, formData) => {
      const result = await createManualBooking(formData);
      if (!result.error) {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {}
  );

  if (services.length === 0 || staff.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px]"
      >
        + Nueva reserva
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">Nueva reserva manual</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone hover:text-ink"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-muted -mt-1">
        Para clientes que agendaron por teléfono, WhatsApp o en persona.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-serviceId" className="text-sm font-medium">Servicio *</label>
          <select
            id="nb-serviceId"
            name="serviceId"
            required
            className="border border-border rounded-lg px-3 py-2 bg-surface"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMin} min)
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-staffId" className="text-sm font-medium">Profesional *</label>
          <select
            id="nb-staffId"
            name="staffId"
            required
            className="border border-border rounded-lg px-3 py-2 bg-surface"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-date" className="text-sm font-medium">Fecha *</label>
          <input
            id="nb-date"
            name="date"
            type="date"
            required
            className="border border-border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-time" className="text-sm font-medium">Hora *</label>
          <input
            id="nb-time"
            name="time"
            type="time"
            required
            className="border border-border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-clientName" className="text-sm font-medium">Nombre del cliente *</label>
          <input
            id="nb-clientName"
            name="clientName"
            type="text"
            required
            className="border border-border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nb-clientPhone" className="text-sm font-medium">Teléfono *</label>
          <input
            id="nb-clientPhone"
            name="clientPhone"
            type="tel"
            required
            placeholder="+56 9 1234 5678"
            className="border border-border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nb-clientEmail" className="text-sm font-medium">
          Email <span className="text-muted font-normal">(opcional, para mandarle confirmación)</span>
        </label>
        <input
          id="nb-clientEmail"
          name="clientEmail"
          type="email"
          className="border border-border rounded-lg px-3 py-2"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Guardando…" : "Guardar reserva"}
      </button>
    </form>
  );
}
