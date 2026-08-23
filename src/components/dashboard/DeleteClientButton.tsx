"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { anonymizeClient } from "@/lib/actions/clients";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await anonymizeClient(clientId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/clientes");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start text-sm text-danger hover:underline"
      >
        Eliminar datos de este cliente
      </button>
    );
  }

  return (
    <div className="bg-danger-soft border border-border rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">
        Esto borra el nombre, teléfono, correo y cumpleaños de este cliente — de su ficha y de
        todo su historial de citas. No se puede deshacer.
      </p>
      <p className="text-sm text-stone">
        Las citas quedan (fecha, servicio, si asistió) para que no se rompan tus estadísticas,
        pero sin ningún dato que identifique a la persona.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="bg-danger text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Eliminando…" : "Sí, eliminar los datos"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="border border-border rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
