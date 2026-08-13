"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "FIXED", label: "Precio fijo" },
  { value: "FROM", label: "Desde $X" },
  { value: "QUOTE", label: "A cotizar" },
] as const;

export function ServicePriceFields() {
  const [priceType, setPriceType] = useState<"FIXED" | "FROM" | "QUOTE">("FIXED");

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Precio</label>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`text-sm border rounded-lg px-2 py-1.5 text-center cursor-pointer ${
              priceType === opt.value
                ? "border-brand ring-1 ring-brand bg-brand-soft"
                : "border-border"
            }`}
          >
            <input
              type="radio"
              name="priceType"
              value={opt.value}
              checked={priceType === opt.value}
              onChange={() => setPriceType(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {priceType === "QUOTE" ? (
        <p className="text-xs text-muted">
          No se muestra un precio público — el cliente ve &quot;A cotizar&quot; y consulta
          directamente. Ideal para servicios como asesorías o estudios jurídicos.
        </p>
      ) : (
        <input
          name="price"
          type="number"
          min={0}
          placeholder={priceType === "FROM" ? "Monto mínimo, ej: 30000" : "10000"}
          className="border border-border rounded-lg px-3 py-2.5"
        />
      )}
    </div>
  );
}
