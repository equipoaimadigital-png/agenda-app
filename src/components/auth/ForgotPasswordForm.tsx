"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";

type State = { error?: string; success?: boolean };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => requestPasswordReset(formData),
    {}
  );

  if (state.success) {
    return (
      <div className="bg-success-soft border border-border rounded-xl p-4 text-sm">
        <p className="font-medium text-success">Revisa tu correo</p>
        <p className="mt-1">
          Si ese correo tiene una cuenta, te enviamos un link para crear una
          contraseña nueva. Puede tardar unos minutos en llegar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="tucorreo@ejemplo.com"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar link de recuperación"}
      </button>
    </form>
  );
}
