"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";

type State = { error?: string };

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => updatePassword(formData),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">Nueva contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
