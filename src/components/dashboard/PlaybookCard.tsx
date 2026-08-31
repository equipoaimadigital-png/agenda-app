"use client";

import { useActionState, useState } from "react";
import { sendPlaybookCampaign } from "@/lib/actions/playbooks";
import { CLIENT_NAME_VAR } from "@/lib/campaign-copy";

type Props = {
  id: string;
  title: string;
  why: string;
  tip: string;
  subject: string;
  body: string;
  targetCount: number;
};

export function PlaybookCard(props: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(props.subject);
  const [body, setBody] = useState(props.body);

  const [state, formAction, isPending] = useActionState<
    { error?: string; sent?: number },
    FormData
  >(async (_prev, formData) => sendPlaybookCampaign(formData), {});

  const done = typeof state.sent === "number";

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{props.title}</p>
          <p className="text-sm text-muted mt-0.5">{props.why}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-stone whitespace-nowrap">
          {props.targetCount} con email
        </span>
      </div>

      {!open && !done && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start text-sm font-medium border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
        >
          Preparar campaña
        </button>
      )}

      {open && !done && (
        <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-3">
          <input type="hidden" name="playbookId" value={props.id} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Asunto</label>
            <input
              name="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-lg border border-border p-2 text-sm bg-surface focus:border-brand outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Mensaje</label>
            <textarea
              name="body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[150px] rounded-lg border border-border p-2 text-sm bg-surface focus:border-brand outline-none"
            />
            <p className="text-xs text-muted">💡 {props.tip}</p>
            <p className="text-xs text-muted">
              <code className="font-numeric">{CLIENT_NAME_VAR}</code> se reemplaza por el nombre de
              cada cliente. Se agregan tu cabecera de marca, el botón &quot;Reservar ahora&quot; y
              el link de desuscripción.
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold shadow-[0_2px_0_rgba(0,0,0,0.14)] active:translate-y-[1px] disabled:opacity-50"
            >
              {isPending ? "Enviando…" : `Enviar a ${props.targetCount}`}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-muted px-3 py-2 hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {done && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          Enviada a {state.sent} cliente{state.sent === 1 ? "" : "s"}. No volverán a aparecer en
          Reactivación por 14 días.
        </p>
      )}
    </div>
  );
}
