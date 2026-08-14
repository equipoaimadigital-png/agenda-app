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
          className="border border-border rounded-xl px-3.5 py-3 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-xl px-4 py-3.5 font-semibold shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
      >
        {isPending ? "Enviando…" : "Enviar link de recuperación"}
      </button>
    </form>
  );
}
