"use client";

import { useActionState } from "react";
import { updateBusinessSettings } from "@/lib/actions/dashboard";
import { HeadingStylePicker } from "@/components/dashboard/HeadingStylePicker";
import type { HeadingFont, HeadingSize } from "@/lib/heading-style";

type Props = {
  businessName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  brandColor: string;
  headingFont: HeadingFont;
  headingSize: HeadingSize;
  instagramUrl: string | null;
  facebookUrl: string | null;
  cancellationHours: number;
};

export function ConfiguracionForm({
  businessName,
  description,
  address,
  phone,
  brandColor,
  headingFont,
  headingSize,
  instagramUrl,
  facebookUrl,
  cancellationHours,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    { error?: string; success?: boolean },
    FormData
  >(updateBusinessSettings, {});

  return (
    <form
      action={formAction}
      className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="businessName" className="text-sm font-medium">Nombre del negocio *</label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          defaultValue={businessName}
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción <span className="text-muted font-normal">(se muestra bajo el nombre)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={description ?? ""}
          placeholder="Ej: Más de 10 años cuidando tu estilo. Atención personalizada en un ambiente cómodo."
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          Dirección o modalidad <span className="text-muted font-normal">(opcional)</span>
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={address ?? ""}
          placeholder="Ej: Av. Providencia 1234, Santiago — o 'Atención online'"
          className="border border-border rounded-lg px-3 py-2.5"
        />
      </div>

      <HeadingStylePicker
        businessName={businessName}
        defaultFont={headingFont}
        defaultSize={headingSize}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono de contacto <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            placeholder="+56 9 1234 5678"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="brandColor" className="text-sm font-medium">Color de tu marca</label>
          <input
            id="brandColor"
            name="brandColor"
            type="color"
            defaultValue={brandColor}
            className="border border-border rounded-lg h-11 w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="instagramUrl" className="text-sm font-medium">
            Instagram <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            defaultValue={instagramUrl ?? ""}
            placeholder="https://instagram.com/tu_negocio"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="facebookUrl" className="text-sm font-medium">
            Facebook <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="facebookUrl"
            name="facebookUrl"
            type="url"
            defaultValue={facebookUrl ?? ""}
            placeholder="https://facebook.com/tu_negocio"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cancellationHours" className="text-sm font-medium">
          Política de cancelación
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Los clientes pueden cancelar/reprogramar hasta</span>
          <input
            id="cancellationHours"
            name="cancellationHours"
            type="number"
            min={0}
            max={168}
            defaultValue={cancellationHours}
            className="border border-border rounded-lg px-3 py-2 w-20 text-center"
          />
          <span className="text-sm text-muted">horas antes de la cita.</span>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          ¡Cambios guardados!
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
