"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { removeStaffPhoto, uploadStaffPhoto } from "@/lib/actions/media";
import { StaffAvatar } from "@/components/dashboard/StaffAvatar";

export function StaffPhotoUploader({
  staffId,
  name,
  color,
  photoUrl,
}: {
  staffId: string;
  name: string;
  color: string;
  photoUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRemoving, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    async (_prev, formData) => {
      const result = await uploadStaffPhoto(staffId, formData);
      if (!result.error) {
        setPreview(null);
        setFileName(null);
      }
      return result;
    },
    {}
  );

  const shown = preview ?? photoUrl;

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input
        ref={fileInputRef}
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
        aria-label={shown ? "Cambiar foto" : "Subir foto"}
        className="relative rounded-full shrink-0 group"
      >
        <StaffAvatar name={name} color={color} photoUrl={shown} size={48} />
        <span className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/45 transition-colors flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100">
          📷
        </span>
      </button>

      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {fileName ? (
            <>
              <span className="text-xs text-muted truncate max-w-[10rem]">{fileName}</span>
              <button
                type="submit"
                disabled={isPending}
                className="bg-brand text-brand-foreground rounded-lg px-3 py-1.5 text-xs font-medium shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)] active:shadow-[0_1px_0_rgba(0,0,0,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
              >
                {isPending ? "Subiendo…" : "Guardar foto"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
              >
                {photoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => {
                    setRemoveError(null);
                    startRemove(async () => {
                      const r = await removeStaffPhoto(staffId);
                      if (r.error) setRemoveError(r.error);
                    });
                  }}
                  className="text-sm text-danger hover:underline disabled:opacity-50"
                >
                  {isRemoving ? "Quitando…" : "Quitar"}
                </button>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-muted">Se muestra en tu página pública. PNG, JPG, WEBP o GIF · máx. 5 MB.</p>
        {(state.error || removeError) && (
          <p className="text-xs text-danger">{state.error ?? removeError}</p>
        )}
      </div>
    </form>
  );
}
