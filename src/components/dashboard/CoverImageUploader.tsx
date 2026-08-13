"use client";

import { useActionState, useState } from "react";
import { uploadCoverImage } from "@/lib/actions/media";

export function CoverImageUploader({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    async (_prev, formData) => uploadCoverImage(formData),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="cover-file" className="text-sm font-medium">
        Imagen de portada <span className="text-muted font-normal">(opcional, máx. 5 MB)</span>
      </label>

      {(preview ?? currentUrl) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview ?? currentUrl ?? ""}
          alt=""
          className="h-28 w-full object-cover rounded-lg border border-border"
        />
      )}

      <div className="flex items-center gap-2">
        <input
          id="cover-file"
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="text-sm flex-1"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border border-border rounded-lg px-3 py-1.5 text-sm font-medium hover:border-brand disabled:opacity-50"
        >
          {isPending ? "Subiendo…" : "Subir"}
        </button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
