"use client";

import { useActionState, useEffect, useState } from "react";
import { createAndSendCampaign, getAudienceCount } from "@/lib/actions/campaigns";

type Template = {
  id: string;
  label: string;
  subject: string;
  body: string;
};

function buildTemplates(businessName: string): Template[] {
  return [
    {
      id: "reactivacion",
      label: "Reactivar clientes",
      subject: `Hace tiempo no te vemos, ${businessName} 💚`,
      body: `Hola,\n\nNotamos que ha pasado un tiempo desde tu última visita y nos encantaría verte de nuevo.\n\nReserva tu próxima hora esta semana y te damos atención preferencial.\n\n¡Te esperamos!`,
    },
    {
      id: "promocion",
      label: "Promoción por tiempo limitado",
      subject: `Oferta especial esta semana en ${businessName}`,
      body: `Hola,\n\nEsta semana tenemos una promoción especial para ti. Los cupos son limitados, así que te recomendamos reservar pronto para asegurar tu horario preferido.\n\n¡No te la pierdas!`,
    },
    {
      id: "nuevo-servicio",
      label: "Anunciar nuevo servicio",
      subject: `Tenemos algo nuevo para ti en ${businessName}`,
      body: `Hola,\n\nQueremos contarte que sumamos un nuevo servicio que seguramente te va a interesar.\n\nSi quieres saber más o reservar directamente, hazlo desde el botón de abajo.\n\n¡Esperamos verte pronto!`,
    },
    {
      id: "agradecimiento",
      label: "Agradecimiento y fidelización",
      subject: `Gracias por confiar en ${businessName}`,
      body: `Hola,\n\nQueríamos agradecerte por elegirnos. Tu confianza es muy importante para nosotros y seguimos trabajando para darte la mejor atención.\n\nSi ya es momento de tu próxima visita, aquí puedes reservar fácilmente.`,
    },
    {
      id: "personalizado",
      label: "Empezar en blanco",
      subject: "",
      body: "",
    },
  ];
}

export function CampaignForm({ businessName }: { businessName: string }) {
  const templates = buildTemplates(businessName);
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [audience, setAudience] = useState<"ALL" | "INACTIVE_30D">("ALL");
  const [count, setCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCount(true);
    getAudienceCount(audience).then((n) => {
      if (!cancelled) {
        setCount(n);
        setLoadingCount(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const [state, formAction, isPending] = useActionState<
    { error?: string; sent?: number },
    FormData
  >(async (_prev, formData) => createAndSendCampaign(formData), {});

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setSubject(t.subject);
    setBody(t.body);
  }

  return (
    <form action={formAction} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Plantilla</label>
        <div className="grid sm:grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className={`text-left text-sm border rounded-lg px-3 py-2 ${
                templateId === t.id
                  ? "border-brand ring-1 ring-brand bg-brand-soft"
                  : "border-border hover:border-brand/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium">Asunto *</label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-border rounded-lg px-3 py-2.5 bg-surface"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium">Mensaje *</label>
        <textarea
          id="body"
          name="body"
          required
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="border border-border rounded-lg px-3 py-2.5 bg-surface"
        />
        <p className="text-xs text-muted">
          Se agrega automáticamente un botón "Reservar ahora" y el link de desuscripción al final.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">¿A quién le llega?</label>
        <div className="grid sm:grid-cols-2 gap-2">
          <label
            className={`text-sm border rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 ${
              audience === "ALL" ? "border-brand ring-1 ring-brand bg-brand-soft" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="audience"
              value="ALL"
              checked={audience === "ALL"}
              onChange={() => setAudience("ALL")}
              className="accent-(--brand)"
            />
            Todos mis clientes
          </label>
          <label
            className={`text-sm border rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 ${
              audience === "INACTIVE_30D" ? "border-brand ring-1 ring-brand bg-brand-soft" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="audience"
              value="INACTIVE_30D"
              checked={audience === "INACTIVE_30D"}
              onChange={() => setAudience("INACTIVE_30D")}
              className="accent-(--brand)"
            />
            Inactivos hace 30+ días
          </label>
        </div>
        <p className="text-xs text-muted mt-1">
          {loadingCount ? "Calculando…" : `Le va a llegar a ${count ?? 0} cliente${count === 1 ? "" : "s"}.`}
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}
      {typeof state.sent === "number" && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          ¡Campaña enviada a {state.sent} cliente{state.sent === 1 ? "" : "s"}!
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || (count ?? 0) === 0}
        className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {isPending ? "Enviando…" : "Enviar campaña"}
      </button>
    </form>
  );
}
