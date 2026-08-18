"use client";

import { useActionState } from "react";
import { updateClient } from "@/lib/actions/clients";

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

type Client = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  birthday: string | null;
};

export function ClientEditForm({ client }: { client: Client }) {
  const [state, formAction, isPending] = useActionState(
    (prev: { error?: string; success?: boolean }, formData: FormData) => updateClient(client.id, prev, formData),
    {}
  );
  const [bMonth, bDay] = client.birthday ? client.birthday.split("-").map(Number) : [undefined, undefined];

  return (
    <form action={formAction} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="cf-name" className="text-sm font-medium">Nombre *</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            defaultValue={client.name ?? ""}
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="cf-phone" className="text-sm font-medium">Teléfono *</label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            required
            defaultValue={client.phone}
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cf-email" className="text-sm font-medium">
          Correo <span className="text-muted font-normal">(opcional)</span>
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          defaultValue={client.email ?? ""}
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium mb-1">
          Cumpleaños <span className="text-muted font-normal">(opcional)</span>
        </legend>
        <div className="flex gap-2">
          <select
            name="day"
            defaultValue={bDay ?? ""}
            className="border border-border rounded-lg px-2 py-2 text-sm bg-surface"
          >
            <option value="">Día</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            name="month"
            defaultValue={bMonth ?? ""}
            className="border border-border rounded-lg px-2 py-2 text-sm bg-surface"
          >
            <option value="">Mes</option>
            {MONTHS_SHORT.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">¡Cambios guardados!</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
