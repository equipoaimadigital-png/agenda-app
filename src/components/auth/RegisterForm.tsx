"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";

type State = { error: string } | undefined;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => signUp(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="businessName" className="text-sm font-medium">
          Nombre de tu negocio
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="Ej: Peluquería Ana"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

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
          className="border border-border rounded-lg px-3 py-2.5"
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
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
