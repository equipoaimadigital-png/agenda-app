"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createAndSendCampaign, getAudienceCount, sendTestCampaign } from "@/lib/actions/campaigns";
import { IconUsers } from "@/components/dashboard/ManualIcons";
import { CampaignClientPicker } from "@/components/dashboard/CampaignClientPicker";
import { CLIENT_NAME_VAR, personalizeCampaignBody } from "@/lib/campaign-copy";

type Audience = "ALL" | "INACTIVE_30D" | "CUSTOM";

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
      label: "Reactivar",
      subject: `Hace tiempo no te vemos, ${businessName} 💚`,
      body: `Hola ${CLIENT_NAME_VAR},\n\nNotamos que ha pasado un tiempo desde tu última visita y nos encantaría verte de nuevo.\n\nReserva tu próxima hora esta semana y te damos atención preferencial.\n\n¡Te esperamos!`,
    },
    {
      id: "promocion",
      label: "Promociones",
      subject: `Oferta especial esta semana en ${businessName}`,
      body: `Hola ${CLIENT_NAME_VAR},\n\nEsta semana tenemos una promoción especial para ti. Los cupos son limitados, así que te recomendamos reservar pronto para asegurar tu horario preferido.\n\n¡No te la pierdas!`,
    },
    {
      id: "nuevo-servicio",
      label: "Nuevo",
      subject: `Tenemos algo nuevo para ti en ${businessName}`,
      body: `Hola ${CLIENT_NAME_VAR},\n\nQueremos contarte que sumamos un nuevo servicio que seguramente te va a interesar.\n\nSi quieres saber más o reservar directamente, hazlo desde el botón de abajo.\n\n¡Esperamos verte pronto!`,
    },
    {
      id: "agradecimiento",
      label: "Fidelización",
      subject: `Gracias por confiar en ${businessName}`,
      body: `Hola ${CLIENT_NAME_VAR},\n\nQueríamos agradecerte por elegirnos. Tu confianza es muy importante para nosotros y seguimos trabajando para darte la mejor atención.\n\nSi ya es momento de tu próxima visita, aquí puedes reservar fácilmente.`,
    },
    {
      id: "personalizado",
      label: "En blanco",
      subject: "",
      body: "",
    },
  ];
}

const DEMO_NAME = "María";

/** Resalta el nombre de prueba dentro del texto ya personalizado, para que se note en la vista previa. */
function renderWithHighlightedName(text: string): React.ReactNode[] {
  const parts = text.split(DEMO_NAME);
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <strong key={`name-${i}`} className="font-semibold">
            {DEMO_NAME}
          </strong>,
          part,
        ]
  );
}

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: "ALL", label: "Todos mis clientes" },
  { value: "INACTIVE_30D", label: "Inactivos hace 30+ días" },
  { value: "CUSTOM", label: "Clientes específicos" },
];

export function CampaignForm({ businessName }: { businessName: string }) {
  const templates = buildTemplates(businessName);
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [audience, setAudience] = useState<Audience>("ALL");
  const [customPhones, setCustomPhones] = useState<string[]>([]);
  // Para audiencia "CUSTOM" el conteo es derivado directo de customPhones —
  // no hace falta guardarlo en estado ni un efecto, se calcula en cada render.
  const [remoteCount, setRemoteCount] = useState<number | null>(null);

  // Al cambiar de audiencia, "olvida" el conteo remoto anterior (vuelve a
  // null = cargando) durante el render, no en un efecto — el efecto de abajo
  // solo hace el fetch async y setea el resultado en su callback.
  const [prevAudience, setPrevAudience] = useState(audience);
  if (audience !== prevAudience) {
    setPrevAudience(audience);
    if (audience !== "CUSTOM") setRemoteCount(null);
  }

  useEffect(() => {
    if (audience === "CUSTOM") return; // conteo ya derivado más abajo
    let cancelled = false;
    getAudienceCount(audience).then((n) => {
      if (!cancelled) setRemoteCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const count = audience === "CUSTOM" ? customPhones.length : remoteCount;
  const isCountLoading = audience !== "CUSTOM" && remoteCount === null;

  const [state, formAction, isPending] = useActionState<
    { error?: string; sent?: number },
    FormData
  >(async (_prev, formData) => createAndSendCampaign(formData), {});

  const [testState, setTestState] = useState<{ error?: string; sent?: boolean }>({});
  const [isTestPending, startTestTransition] = useTransition();

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setSubject(t.subject);
    setBody(t.body);
  }

  function runTestSend() {
    const fd = new FormData();
    fd.set("subject", subject);
    fd.set("body", body);
    startTestTransition(async () => {
      const result = await sendTestCampaign(fd);
      setTestState(result);
    });
  }

  const previewBody = body
    ? renderWithHighlightedName(personalizeCampaignBody(body, DEMO_NAME))
    : "Tu mensaje aparece aquí a medida que lo escribes.";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8">
      {/* Editor */}
      <form action={formAction} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Plantilla</label>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className={`text-sm font-medium rounded-full px-3.5 py-1.5 border transition-colors ${
                  templateId === t.id
                    ? "bg-brand-soft text-brand border-brand"
                    : "bg-surface text-stone border-border hover:border-brand/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="subject" className="text-sm font-semibold text-ink">
            Asunto <span className="text-danger">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-border p-2.5 bg-surface focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="body" className="text-sm font-semibold text-ink">
            Mensaje <span className="text-danger">*</span>
          </label>
          <textarea
            id="body"
            name="body"
            required
            className="w-full min-h-[200px] rounded-xl border border-border p-2.5 bg-surface focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <p className="text-xs text-muted">
            Se agrega automáticamente un botón &quot;Reservar ahora&quot; y el link de
            desuscripción al final. Si no escribes{" "}
            <code className="font-numeric">{CLIENT_NAME_VAR}</code>, igual saludamos a cada
            cliente por su nombre al principio — ya tenemos el dato.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">¿A quién le llega?</label>
          <div className="flex flex-wrap gap-3">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={`flex-1 min-w-[150px] text-left rounded-xl p-3 flex items-center gap-2.5 transition-all ${
                  audience === opt.value
                    ? "border-2 border-brand bg-paper"
                    : "border border-border hover:border-brand/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    audience === opt.value ? "border-brand" : "border-border-strong"
                  }`}
                >
                  {audience === opt.value && <span className="w-2 h-2 rounded-full bg-brand" />}
                </span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="audience" value={audience} />

          {audience === "CUSTOM" && (
            <>
              <input type="hidden" name="customPhones" value={JSON.stringify(customPhones)} />
              <CampaignClientPicker selected={customPhones} onChange={setCustomPhones} />
            </>
          )}
        </div>

        {state.error && (
          <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
        )}
        {typeof state.sent === "number" && (
          <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
            ¡Campaña enviada a {state.sent} cliente{state.sent === 1 ? "" : "s"}!
          </p>
        )}
        {testState.error && (
          <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{testState.error}</p>
        )}
        {testState.sent && (
          <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
            Te mandamos la prueba a tu propio correo.
          </p>
        )}

        <div className="flex justify-between items-center flex-wrap gap-3 mt-1 pt-5 border-t border-border">
          <span className="text-sm font-medium text-stone flex items-center gap-1.5">
            <IconUsers className="w-4 h-4" aria-hidden />
            {isCountLoading
              ? "Calculando destinatarios…"
              : `Le va a llegar a ${count ?? 0} cliente${count === 1 ? "" : "s"}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runTestSend}
              disabled={isTestPending || !subject || !body}
              className="bg-surface border border-border hover:bg-paper text-ink font-medium py-2 px-4 rounded-xl active:scale-[0.97] disabled:opacity-50"
            >
              {isTestPending ? "Enviando prueba…" : "Test de envío"}
            </button>
            <button
              type="submit"
              disabled={isPending || (count ?? 0) === 0}
              className="bg-brand hover:opacity-90 text-brand-foreground font-semibold py-2.5 px-6 rounded-xl shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)] transition-colors disabled:opacity-50 disabled:shadow-none"
            >
              {isPending ? "Enviando…" : "Enviar campaña"}
            </button>
          </div>
        </div>
      </form>

      {/* Vista previa en vivo */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="w-[320px] h-[650px] mx-auto border-[10px] border-ink rounded-[3rem] relative bg-paper shadow-2xl overflow-hidden">
            <div
              aria-hidden
              className="absolute top-0 inset-x-0 h-6 w-32 mx-auto bg-ink rounded-b-2xl z-10"
            />
            <div className="h-full overflow-y-auto pt-9 pb-6 px-4">
              <div className="bg-surface rounded-xl p-3 mb-3">
                <p className="font-semibold text-sm leading-snug">
                  {subject || "(sin asunto todavía)"}
                </p>
                <p className="text-xs text-muted mt-0.5">Remitente: {businessName}</p>
              </div>

              <div
                aria-hidden
                className="bg-border/60 rounded-md h-32 w-full mb-4 flex items-center justify-center text-muted"
              >
                <IconUsers className="w-6 h-6 opacity-40" />
              </div>

              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {previewBody}
              </p>

              <span className="w-full max-w-[200px] mx-auto block text-center bg-brand text-brand-foreground py-3 rounded-lg font-semibold mt-6">
                Reservar ahora
              </span>
            </div>
          </div>
          <p className="text-xs text-muted text-center mt-3">
            Así se ve en el teléfono de tu cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
