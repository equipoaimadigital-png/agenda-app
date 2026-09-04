"use client";

import { useState } from "react";

function formatPrice(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

const buttonClass =
  "self-start rounded-lg px-4 py-3 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]";

type Props = {
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  professionalEmail: string;
  startOneTimeMonthly: () => Promise<void>;
  startAnnual: () => Promise<void>;
  startRecurring: (formData: FormData) => Promise<void>;
};

export function PlanTabs({
  monthlyPrice,
  annualPrice,
  annualSavings,
  professionalEmail,
  startOneTimeMonthly,
  startAnnual,
  startRecurring,
}: Props) {
  const [tab, setTab] = useState<"mensual" | "anual">("mensual");

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex self-start rounded-lg border border-border bg-surface p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("mensual")}
          aria-pressed={tab === "mensual"}
          className={`rounded-md px-4 py-2 transition-colors ${
            tab === "mensual" ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => setTab("anual")}
          aria-pressed={tab === "anual"}
          className={`rounded-md px-4 py-2 transition-colors ${
            tab === "anual" ? "bg-brass text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Anual{" "}
          <span
            className={tab === "anual" ? "text-white/90" : "text-brass"}
          >
            · 2 meses gratis
          </span>
        </button>
      </div>

      {tab === "mensual" && (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
            <p className="font-medium">Pagar 1 mes</p>
            <p className="text-sm text-muted">
              Un pago único de {formatPrice(monthlyPrice)}. Sirve con{" "}
              <strong>débito, crédito o efectivo</strong>. Renuevas tú cada mes (te avisamos).
            </p>
            <form action={startOneTimeMonthly}>
              <button type="submit" className={`${buttonClass} bg-brand text-brand-foreground`}>
                Pagar {formatPrice(monthlyPrice)} por 1 mes
              </button>
            </form>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
            <div>
              <p className="font-medium">Cobro automático cada mes</p>
              <p className="text-sm text-muted">
                Se cobra solo, no tienes que acordarte. Necesita <strong>tarjeta de crédito</strong> —
                varias tarjetas de débito de bancos chilenos no permiten el cobro recurrente.
              </p>
            </div>
            <form action={startRecurring} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="mpEmail" className="text-sm font-medium">
                  Correo de tu cuenta de Mercado Pago
                </label>
                <input
                  id="mpEmail"
                  name="mpEmail"
                  type="email"
                  required
                  defaultValue={professionalEmail}
                  placeholder="tucorreo@ejemplo.com"
                  className="border border-border rounded-lg px-3 py-2.5 max-w-sm"
                />
                <p className="text-xs text-muted">
                  Debe ser el correo con el que inicias sesión en Mercado Pago, o el checkout no te
                  deja confirmar.
                </p>
              </div>
              <button
                type="submit"
                className="self-start border border-border bg-surface rounded-lg px-4 py-3 font-medium hover:border-brand active:scale-[0.98]"
              >
                Activar cobro automático
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "anual" && (
        <div className="relative bg-surface border border-brass rounded-xl p-4 flex flex-col gap-2">
          <span className="absolute -top-2.5 left-4 text-xs font-semibold bg-brass text-white rounded-full px-2.5 py-0.5">
            2 meses gratis
          </span>
          <p className="font-medium mt-1">Pagar 1 año</p>
          <p className="text-sm text-muted">
            Un pago único de {formatPrice(annualPrice)} — te ahorras{" "}
            <strong>{formatPrice(annualSavings)}</strong> frente a pagar mes a mes. Sirve con{" "}
            <strong>débito, crédito o efectivo</strong>. Tu plan queda al día por 12 meses.
          </p>
          <form action={startAnnual}>
            <button type="submit" className={`${buttonClass} bg-brass text-white`}>
              Pagar {formatPrice(annualPrice)} por 1 año
            </button>
          </form>
        </div>
      )}

      <p className="text-xs text-muted">
        Te llevamos al checkout seguro de Mercado Pago. Nunca vemos ni guardamos los datos de tu
        tarjeta.
      </p>
    </div>
  );
}
