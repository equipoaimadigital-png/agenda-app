"use client";

import { useActionState, useRef, useState } from "react";
import { uploadCoverImage } from "@/lib/actions/media";

export function CoverImageUploader({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    async (_prev, formData) => uploadCoverImage(formData),
    {}
  );

  const image = preview ?? currentUrl;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        Imagen de portada <span className="text-muted font-normal">(opcional, máx. 5 MB)</span>
      </label>
      <p className="text-xs text-muted -mt-1">
        Esta foto aparece como fondo en la parte superior de tu página de reservas.
      </p>

      <input
        ref={fileInputRef}
        id="cover-file"
        name="file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
          setFileName(file?.name ?? null);
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative rounded-lg border border-dashed border-border-strong hover:border-brand overflow-hidden text-left"
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-32 w-full object-cover" />
            <span className="absolute inset-0 bg-ink/0 hover:bg-ink/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-sm font-medium">📷 Cambiar foto</span>
            </span>
          </>
        ) : (
          <span className="h-32 w-full flex flex-col items-center justify-center gap-1 text-muted bg-brand-soft/40">
            <span className="text-2xl" aria-hidden>📷</span>
            <span className="text-sm font-medium">Haz clic aquí para subir una foto</span>
            <span className="text-xs">PNG, JPG, WEBP o GIF · máx. 5 MB</span>
          </span>
        )}
      </button>

      <div className="flex items-center gap-2">
        {fileName && (
          <p className="text-xs text-muted flex-1 truncate">Seleccionaste: {fileName}</p>
        )}
        <button
          type="submit"
          disabled={isPending || !fileName}
          className="ml-auto bg-brand text-brand-foreground rounded-lg px-3 py-1.5 text-sm font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
        >
          {isPending ? "Subiendo…" : "Guardar foto"}
        </button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
