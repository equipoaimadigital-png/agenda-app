"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { createService } from "@/lib/actions/services";
import { ServicePriceFields } from "@/components/dashboard/ServicePriceFields";

type State = { error?: string; success?: boolean };

export function CreateServiceForm({ mpConnected }: { mpConnected: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (prev, formData) => {
      const result = await createService(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    {}
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre del servicio *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Ej: Corte de pelo"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción <span className="text-muted font-normal">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Ej: Incluye lavado y peinado"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="durationMin" className="text-sm font-medium">
          Duración (min) *
        </label>
        <input
          id="durationMin"
          name="durationMin"
          type="number"
          min={5}
          step={5}
          required
          placeholder="30"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <ServicePriceFields />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">
          Depósito para asegurar la reserva{" "}
          <span className="text-muted font-normal">(opcional)</span>
        </legend>
        {mpConnected ? (
          <>
            <select
              name="depositMode"
              defaultValue="NONE"
              aria-label="Modo del depósito"
              className="border border-border rounded-lg px-3 py-2.5 bg-surface"
            >
              <option value="NONE">Sin depósito</option>
              <option value="OPTIONAL">Opcional — el cliente elige si asegura su hora</option>
              <option value="REQUIRED">Obligatorio — no se confirma sin pagar</option>
            </select>
            <input
              name="depositAmount"
              type="number"
              min={0}
              step={500}
              placeholder="Monto del depósito (ej: 5000)"
              className="border border-border rounded-lg px-3 py-2.5"
            />
            <p className="text-xs text-muted">
              El depósito llega directo a tu cuenta de Mercado Pago. Solo se aplica si eliges un
              modo y pones un monto.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted bg-brand-soft rounded-lg px-3 py-2">
            Conecta tu cuenta de Mercado Pago en{" "}
            <Link href="/dashboard/configuracion" className="underline">
              Configuración
            </Link>{" "}
            para poder pedir depósito en este servicio.
          </p>
        )}
      </fieldset>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          Servicio agregado. Ya aparece abajo.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px] disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Agregando…" : "Agregar servicio"}
      </button>
    </form>
  );
}
