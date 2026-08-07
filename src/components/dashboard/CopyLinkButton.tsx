"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
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
      className="text-xs font-medium bg-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-brand"
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
