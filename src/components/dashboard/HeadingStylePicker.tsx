"use client";

import { useState } from "react";
import {
  HEADING_FONT_OPTIONS,
  HEADING_SIZE_OPTIONS,
  type HeadingFont,
  type HeadingSize,
} from "@/lib/heading-style";

export function HeadingStylePicker({
  businessName,
  defaultFont,
  defaultSize,
}: {
  businessName: string;
  defaultFont: HeadingFont;
  defaultSize: HeadingSize;
}) {
  const [font, setFont] = useState<HeadingFont>(defaultFont);
  const [size, setSize] = useState<HeadingSize>(defaultSize);

  const fontOpt = HEADING_FONT_OPTIONS.find((o) => o.value === font)!;
  const sizeOpt = HEADING_SIZE_OPTIONS.find((o) => o.value === size)!;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Estilo del nombre y la descripción{" "}
        <span className="text-muted font-normal">(cómo se ven en tu página pública)</span>
      </label>

      <div className="rounded-lg bg-ink text-white p-4 overflow-hidden">
        <p className={`${fontOpt.className} font-semibold leading-tight ${sizeOpt.nameClass}`}>
          {businessName || "Nombre de tu negocio"}
        </p>
        <p className={`${fontOpt.className} text-white/70 mt-1 ${sizeOpt.descriptionClass}`}>
          Así se ve tu descripción en la página de reservas.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {HEADING_FONT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`text-sm border rounded-lg px-2 py-2 text-center cursor-pointer ${opt.className} ${
              font === opt.value ? "border-brand ring-1 ring-brand bg-brand-soft" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="headingFont"
              value={opt.value}
              checked={font === opt.value}
              onChange={() => setFont(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HEADING_SIZE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`text-sm border rounded-lg px-2 py-1.5 text-center cursor-pointer ${
              size === opt.value ? "border-brand ring-1 ring-brand bg-brand-soft" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="headingSize"
              value={opt.value}
              checked={size === opt.value}
              onChange={() => setSize(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
