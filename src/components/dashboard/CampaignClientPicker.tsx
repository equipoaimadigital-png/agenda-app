"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listClientsForCampaign().then(setClients);
  }, []);

  // Cierra el flotante al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const byPhone = new Map((clients ?? []).map((c) => [c.phone, c]));
  const filtered = (clients ?? []).filter((c) =>
    `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(phone: string) {
    onChange(selected.includes(phone) ? selected.filter((p) => p !== phone) : [...selected, phone]);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 border border-border rounded-xl px-3.5 py-2.5 bg-surface text-sm text-left hover:border-brand/50"
      >
        <span className={selected.length ? "font-medium" : "text-muted"}>
          {selected.length === 0
            ? "Elige uno o más clientes por email…"
            : `${selected.length} cliente${selected.length === 1 ? "" : "s"} seleccionado${selected.length === 1 ? "" : "s"}`}
        </span>
        <span aria-hidden className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((phone) => {
            const c = byPhone.get(phone);
            return (
              <span
                key={phone}
                className="inline-flex items-center gap-1.5 bg-brand-soft text-brand text-xs font-medium rounded-full pl-2.5 pr-1.5 py-1"
              >
                {c?.email ?? phone}
                <button
                  type="button"
                  onClick={() => toggle(phone)}
                  aria-label={`Quitar ${c?.email ?? phone}`}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-brand/20"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)] p-3 flex flex-col gap-2.5">
          <input
            type="text"
            autoFocus
            placeholder="Buscar por email, nombre o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-paper text-sm outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />

          {clients === null ? (
            <p className="text-sm text-muted px-1">Cargando clientes…</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted px-1">
              Todavía no tienes clientes con email registrado.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5">
              {filtered.map((c) => (
                <label
                  key={c.phone}
                  className="flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg hover:bg-paper cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.phone)}
                    onChange={() => toggle(c.phone)}
                    className="accent-(--brand) shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">{c.email}</span>
                    <span className="block text-muted text-xs truncate">
                      {c.name || "(sin nombre)"} · {c.phone}
                    </span>
                  </span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted px-1">Sin resultados para &quot;{query}&quot;.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
