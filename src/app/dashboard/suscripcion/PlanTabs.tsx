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
  annualListPrice: number;
  annualSavings: number;
  startRecurring: () => Promise<void>;
  startAnnual: () => Promise<void>;
};

export function PlanTabs({
  monthlyPrice,
  annualPrice,
  annualListPrice,
  annualSavings,
  startRecurring,
  startAnnual,
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
          <span className={tab === "anual" ? "text-white/90" : "text-brass"}>· 2 meses gratis</span>
        </button>
      </div>

      {tab === "mensual" && (
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="font-medium">Cobro automático cada mes</p>
            <p className="text-sm text-muted">
              {formatPrice(monthlyPrice)} al mes, se cobra solo — no tienes que acordarte de nada.
              Mercado Pago te pide el correo y la tarjeta en el siguiente paso. Funciona con{" "}
              <strong>tarjeta de crédito</strong> (y algunas de débito). Puedes cancelarlo cuando
              quieras desde tu cuenta de Mercado Pago.
            </p>
          </div>
          <form action={startRecurring}>
            <button type="submit" className={`${buttonClass} bg-brand text-brand-foreground`}>
              Activar cobro automático
            </button>
          </form>
        </div>
      )}

      {tab === "anual" && (
        <div className="relative bg-surface border border-brass rounded-xl p-4 flex flex-col gap-2">
          <span className="absolute -top-2.5 left-4 text-xs font-semibold bg-brass text-white rounded-full px-2.5 py-0.5">
            2 meses gratis
          </span>
          <p className="font-medium mt-1">Pagar 1 año</p>
          <p className="flex items-baseline gap-2">
            <span className="text-sm text-muted line-through">{formatPrice(annualListPrice)}</span>
            <span className="text-lg font-semibold">{formatPrice(annualPrice)}</span>
            <span className="text-sm text-muted">al año</span>
          </p>
          <p className="text-sm text-muted">
            Un pago único, con los <strong>2 meses gratis ya aplicados</strong> — te ahorras{" "}
            <strong>{formatPrice(annualSavings)}</strong> frente a pagar mes a mes. Sirve con{" "}
            <strong>débito o crédito</strong>. Tu plan queda al día por 12 meses.
          </p>
          <form action={startAnnual}>
            <button type="submit" className={`${buttonClass} bg-brass text-white`}>
              Pagar {formatPrice(annualPrice)} por 1 año (2 meses gratis)
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
