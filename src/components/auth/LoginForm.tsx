"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";

type State = { error: string } | undefined;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => signIn(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="tucorreo@ejemplo.com"
          className="border border-border rounded-xl px-3.5 py-3 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="border border-border rounded-xl px-3.5 py-3 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-xl px-4 py-3.5 font-semibold shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
