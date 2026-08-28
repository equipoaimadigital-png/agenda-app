"use client";

import { useState, useTransition } from "react";
import { resumeDepositPayment } from "@/lib/actions/manage-booking";

export function PayDepositButton({ token, amount }: { token: string; amount: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await resumeDepositPayment(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) window.location.href = result.url;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={pay}
        disabled={isPending}
        className="bg-brand text-brand-foreground rounded-lg px-4 py-3 text-center font-medium disabled:opacity-50"
      >
        {isPending ? "Abriendo pago…" : `Pagar depósito de $${amount.toLocaleString("es-CL")}`}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
