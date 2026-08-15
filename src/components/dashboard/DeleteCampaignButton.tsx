"use client";

import { useTransition } from "react";
import { deleteCampaign } from "@/lib/actions/campaigns";

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta campaña del historial? Esto no la reenvía ni afecta a quienes ya la recibieron.")) {
      return;
    }
    startTransition(() => deleteCampaign(campaignId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Eliminar del historial"
      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      ×
    </button>
  );
}
