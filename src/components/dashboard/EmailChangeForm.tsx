"use client";

import { useActionState } from "react";
import { requestEmailChange } from "@/lib/actions/auth";

type State = { error?: string; success?: boolean; email?: string };

export function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => requestEmailChange(formData),
    {}
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">Correo de acceso</p>
        <p className="text-sm text-muted mt-0.5">
          Con este correo inicias sesión y te llegan los avisos de reservas nuevas. Ahora es{" "}
          <strong className="text-ink">{currentEmail}</strong>.
        </p>
      </div>

      {state.success ? (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          Te enviamos un link de confirmación a <strong>{state.email}</strong>. Ábrelo desde ese
          correo para completar el cambio. Hasta entonces sigues entrando con el correo actual.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="new-email" className="text-sm font-medium">
              Nuevo correo
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              placeholder="nuevo@ejemplo.com"
              className="border border-border rounded-lg px-3 py-2.5 bg-surface focus:border-brand outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="border border-border bg-surface rounded-lg px-4 py-2.5 text-sm font-medium hover:border-brand active:scale-[0.97] disabled:opacity-50 shrink-0"
          >
            {isPending ? "Enviando…" : "Cambiar correo"}
          </button>
        </form>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </div>
  );
}
