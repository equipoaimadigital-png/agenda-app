"use client";

import { useActionState, useState } from "react";
import { sendReactivationCampaign } from "@/lib/actions/reactivation";
import { CLIENT_NAME_VAR } from "@/lib/campaign-copy";

export function ReactivationComposer({
  businessName,
  overdueWithEmail,
  soonWithEmail,
}: {
  businessName: string;
  overdueWithEmail: number;
  soonWithEmail: number;
}) {
  const [subject, setSubject] = useState(`Te echamos de menos en ${businessName}`);
  const [body, setBody] = useState(
    `Hola ${CLIENT_NAME_VAR},\n\nHace un tiempo que no te vemos y nos encantaría recibirte de nuevo. Puedes reservar tu próxima hora cuando quieras, desde el botón de abajo.\n\n¡Te esperamos!`
  );
  const [includeSoon, setIncludeSoon] = useState(false);

  const [state, formAction, isPending] = useActionState<
    { error?: string; sent?: number },
    FormData
  >(async (_prev, formData) => sendReactivationCampaign(formData), {});

  const recipients = includeSoon ? overdueWithEmail + soonWithEmail : overdueWithEmail;

  return (
    <form
      action={formAction}
      className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_rgba(0,0,0,0.06)]"
    >
      <input type="hidden" name="scope" value={includeSoon ? "overdue_soon" : "overdue"} />

      <div className="flex flex-col gap-1">
        <label htmlFor="r-subject" className="text-sm font-semibold text-ink">
          Asunto <span className="text-danger">*</span>
        </label>
        <input
          id="r-subject"
          name="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-border p-2.5 bg-surface focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="r-body" className="text-sm font-semibold text-ink">
          Mensaje <span className="text-danger">*</span>
        </label>
        <textarea
          id="r-body"
          name="body"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full min-h-[170px] rounded-xl border border-border p-2.5 bg-surface focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none"
        />
        <p className="text-xs text-muted">
          Se agregan solos tu cabecera de marca, el botón &quot;Reservar ahora&quot; y el link
          para desuscribirse.{" "}
          <code className="font-numeric">{CLIENT_NAME_VAR}</code> se reemplaza por el nombre de
          cada cliente.
        </p>
      </div>

      {soonWithEmail > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeSoon}
            onChange={(e) => setIncludeSoon(e.target.checked)}
            className="accent-(--brand) w-4 h-4"
          />
          Incluir también a los que están por atrasarse (+{soonWithEmail})
        </label>
      )}

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}
      {typeof state.sent === "number" && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          Enviado a {state.sent} cliente{state.sent === 1 ? "" : "s"}. No volverán a aparecer aquí
          por 14 días.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || recipients === 0}
        className="self-start bg-brand text-brand-foreground rounded-xl px-5 py-2.5 font-semibold shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)] transition-colors disabled:opacity-50 disabled:shadow-none"
      >
        {isPending
          ? "Enviando…"
          : recipients === 0
            ? "Sin destinatarios con email"
            : `Enviar a ${recipients} cliente${recipients === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
