"use client";

import { useEffect, useState } from "react";
import { listClientsForCampaign } from "@/lib/actions/campaigns";

type ClientOption = { phone: string; name: string; email: string };

export function CampaignClientPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (phones: string[]) => void;
}) {
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listClientsForCampaign().then(setClients);
  }, []);

  const filtered = (clients ?? []).filter((c) =>
    `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(phone: string) {
    onChange(selected.includes(phone) ? selected.filter((p) => p !== phone) : [...selected, phone]);
  }

  return (
    <div className="border border-border rounded-xl p-3 bg-paper flex flex-col gap-2.5">
      <input
        type="text"
        placeholder="Buscar por nombre o teléfono…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border border-border rounded-lg px-3 py-2 bg-surface text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
      />

      {clients === null ? (
        <p className="text-sm text-muted px-1">Cargando clientes…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-muted px-1">
          Todavía no tienes clientes con email registrado.
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          {filtered.map((c) => (
            <label
              key={c.phone}
              className="flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg hover:bg-surface cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(c.phone)}
                onChange={() => toggle(c.phone)}
                className="accent-(--brand)"
              />
              <span className="font-medium truncate">{c.name || "(sin nombre)"}</span>
              <span className="text-muted text-xs shrink-0 ml-auto">{c.phone}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted px-1">Sin resultados para &quot;{query}&quot;.</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted px-1">
        {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
