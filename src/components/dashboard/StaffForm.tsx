"use client";

import { useActionState } from "react";

type Service = { id: string; name: string };
type FormState = { error?: string; success?: boolean };

export function StaffForm({
  action,
  services,
  initialName = "",
  initialColor = "#2f4a3e",
  initialServiceIds = [],
  submitLabel,
  onDone,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  services: Service[];
  initialName?: string;
  initialColor?: string;
  initialServiceIds?: string[];
  submitLabel: string;
  onDone?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result.success) onDone?.();
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="staff-name" className="text-sm font-medium">Nombre *</label>
          <input
            id="staff-name"
            name="name"
            type="text"
            required
            defaultValue={initialName}
            placeholder="Ej: María Pérez"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="staff-color" className="text-sm font-medium">Color</label>
          <input
            id="staff-color"
            name="color"
            type="color"
            defaultValue={initialColor}
            className="border border-border rounded-lg h-[42px] w-14 cursor-pointer"
          />
        </div>
      </div>

      {services.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium mb-1">Servicios que puede realizar</legend>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm cursor-pointer has-checked:bg-brand-soft has-checked:border-brand"
              >
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={s.id}
                  defaultChecked={initialServiceIds.includes(s.id)}
                  className="accent-(--brand)"
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
