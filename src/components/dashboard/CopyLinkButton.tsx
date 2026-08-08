"use client";

import { useState } from "react";

export function CopyLinkButton({ url, dark = false }: { url: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // El portapapeles puede fallar en contextos no seguros; se ignora
        }
      }}
      className={
        dark
          ? "text-xs font-medium bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 hover:bg-white/15"
          : "text-xs font-medium bg-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-brand"
      }
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
