"use client";

import { useActionState } from "react";
import { sendSupportRequest } from "@/lib/actions/support";
import { SUPPORT_CATEGORIES } from "@/lib/support-categories";

export function SupportForm() {
  const [state, formAction, isPending] = useActionState<
    { error?: string; sent?: boolean },
    FormData
  >(sendSupportRequest, {});

  if (state.sent) {
    return (
      <div className="bg-success-soft border border-border rounded-xl p-4 text-sm">
        <p className="font-medium text-success">¡Listo, lo recibimos!</p>
        <p className="mt-1">
          Te vamos a responder directo a tu correo. Si es algo urgente, también puedes
          escribirnos a{" "}
          <a href="mailto:equipo.aimadigital@gmail.com" className="underline">
            equipo.aimadigital@gmail.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium">¿De qué se trata?</label>
        <select
          id="category"
          name="category"
          required
          defaultValue={SUPPORT_CATEGORIES[0]}
          className="border border-border rounded-lg px-3 py-2.5 bg-surface"
        >
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium">Cuéntanos qué pasó</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="Mientras más detalle, más rápido te podemos ayudar — qué intentabas hacer, qué esperabas que pasara, y qué pasó en realidad."
          className="border border-border rounded-lg px-3 py-2.5 bg-surface"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start bg-brand text-brand-foreground rounded-xl px-4 py-2.5 font-semibold shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Enviando…" : "Enviar a soporte"}
      </button>
    </form>
  );
}
