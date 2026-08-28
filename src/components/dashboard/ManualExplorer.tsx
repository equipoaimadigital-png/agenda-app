"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FAQ, SECTIONS, slug } from "@/app/dashboard/manual/manual-content";
import { IconHelp, IconSearch } from "@/components/dashboard/ManualIcons";

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Resalta las coincidencias del texto buscado (sin distinguir acentos ni mayúsculas). */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const hay = fold(text);
  const needle = fold(q);
  const out: ReactNode[] = [];
  let from = 0;
  let hit = hay.indexOf(needle, from);
  let key = 0;

  // fold() no cambia la longitud (NFD + quitar diacríticos deja 1 char por letra
  // base en la práctica para el español), así que los índices calzan con `text`.
  while (hit !== -1 && needle.length > 0) {
    if (hit > from) out.push(text.slice(from, hit));
    out.push(
      <mark key={key++} className="rounded bg-brass/25 px-0.5 text-inherit">
        {text.slice(hit, hit + needle.length)}
      </mark>
    );
    from = hit + needle.length;
    hit = hay.indexOf(needle, from);
  }
  out.push(text.slice(from));
  return <>{out}</>;
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass">
      {children}
    </span>
  );
}

/** Marca la sección visible mientras se hace scroll, para el índice de arriba. */
function useActiveSection(ids: string[]): string | null {
  const key = ids.join("|");
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    const list = key ? key.split("|") : [];
    const els = list
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setSeen(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  // El activo efectivo se deriva en render: si lo último visto ya no está en
  // la lista (p. ej. tras filtrar por búsqueda), cae a la primera sección.
  if (seen && ids.includes(seen)) return seen;
  return ids[0] ?? null;
}

function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return progress;
}

export function ManualExplorer({ publicHref }: { publicHref: string }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const q = query.trim();
  const searching = q.length > 0;
  const needle = fold(q);

  const filteredSections = useMemo(() => {
    if (!searching) return SECTIONS.map((section) => ({ section, items: section.items }));
    return SECTIONS.map((section) => {
      const sectionHit = fold(`${section.title} ${section.intro}`).includes(needle);
      const items = section.items.filter((item) =>
        fold(`${item.label} ${item.body} ${item.steps?.join(" ") ?? ""}`).includes(needle)
      );
      return { section, items: sectionHit && items.length === 0 ? section.items : items };
    }).filter((entry) => entry.items.length > 0);
  }, [needle, searching]);

  const filteredFaq = useMemo(() => {
    if (!searching) return FAQ;
    return FAQ.filter((f) => fold(`${f.q} ${f.a}`).includes(needle));
  }, [needle, searching]);

  const visibleIds = useMemo(() => {
    const ids = filteredSections.map((entry) => slug(entry.section.title));
    if (filteredFaq.length > 0) ids.push("faq");
    return ids;
  }, [filteredSections, filteredFaq]);

  const activeId = useActiveSection(visibleIds);
  const progress = useReadingProgress();

  const isOpen = (id: string) => searching || !collapsed.has(id);
  const allOpen = collapsed.size === 0;
  const nothingFound = filteredSections.length === 0 && filteredFaq.length === 0;

  function toggleSection(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setCollapsed(allOpen ? new Set(visibleIds.filter((id) => id !== "faq")) : new Set());
  }

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Índice por temas — resalta la sección en la que estás */}
      <nav aria-label="Temas del manual" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SECTIONS.map((s) => {
          const id = slug(s.title);
          const Icon = s.icon;
          const current = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => jumpTo(id)}
              aria-current={current ? "true" : undefined}
              className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-brand hover:shadow-sm ${
                current ? "border-brand bg-brand-soft" : "border-border bg-surface"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  current
                    ? "bg-brand text-brand-foreground"
                    : "bg-brand-soft text-brand group-hover:bg-brand group-hover:text-brand-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="block text-sm font-medium">{s.title}</span>
                  {s.badge && <Badge>{s.badge}</Badge>}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{s.intro}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => jumpTo("faq")}
          aria-current={activeId === "faq" ? "true" : undefined}
          className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-brand hover:shadow-sm ${
            activeId === "faq" ? "border-brand bg-brand-soft" : "border-border bg-surface"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
              activeId === "faq"
                ? "bg-brand text-brand-foreground"
                : "bg-brand-soft text-brand group-hover:bg-brand group-hover:text-brand-foreground"
            }`}
          >
            <IconHelp className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">Preguntas frecuentes</span>
            <span className="mt-0.5 block text-xs text-muted">Las dudas más comunes.</span>
          </span>
        </button>
      </nav>

      {/* Barra fija: progreso de lectura + buscador + abrir/cerrar todo */}
      <div className="sticky top-0 z-10 -mx-1 bg-paper px-1 pb-3 pt-1">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el manual…"
              aria-label="Buscar en el manual"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={toggleAll}
            disabled={searching}
            className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:border-brand disabled:opacity-40"
          >
            {allOpen ? "Contraer todo" : "Expandir todo"}
          </button>
        </div>
        {searching && (
          <p className="mt-2 text-xs text-muted">
            {nothingFound
              ? `Sin resultados para "${q}".`
              : `Mostrando lo que coincide con "${q}". Borra la búsqueda para ver todo.`}
          </p>
        )}
      </div>

      {/* Secciones */}
      <div className="flex flex-col gap-4">
        {filteredSections.map(({ section, items }) => {
          const id = slug(section.title);
          const Icon = section.icon;
          const open = isOpen(id);
          const hasSteps = items.some((it) => it.steps && it.steps.length > 0);
          return (
            <section
              key={id}
              id={id}
              className="scroll-mt-24 rounded-2xl border border-border bg-surface/40"
            >
              <h2>
                <button
                  type="button"
                  onClick={() => !searching && toggleSection(id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-semibold leading-tight">
                        {section.title}
                      </span>
                      {section.badge && <Badge>{section.badge}</Badge>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{section.intro}</span>
                  </span>
                  {!searching && (
                    <span
                      aria-hidden
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      ⌄
                    </span>
                  )}
                </button>
              </h2>

              {open && (
                <div
                  className={`grid gap-2.5 px-4 pb-4 sm:pl-[4.5rem] ${
                    hasSteps ? "" : "sm:grid-cols-2"
                  }`}
                >
                  {items.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border border-l-[3px] border-l-brass bg-surface p-4"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <Highlight text={item.label} query={q} />
                        {item.badge && <Badge>{item.badge}</Badge>}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        <Highlight text={item.body} query={q} />
                      </p>
                      {item.steps && item.steps.length > 0 && (
                        <ol className="mt-3 flex flex-col gap-2.5">
                          {item.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                                {i + 1}
                              </span>
                              <span className="pt-0.5 text-muted">
                                <Highlight text={step} query={q} />
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Preguntas frecuentes */}
      {filteredFaq.length > 0 && (
        <section id="faq" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <IconHelp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">Preguntas frecuentes</h2>
              <p className="text-xs text-muted">Lo que más preguntan otros negocios.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:pl-[3.25rem]">
            {filteredFaq.map((f) => (
              <details
                key={f.q}
                open={searching}
                className="group rounded-xl border border-border bg-surface p-4 open:border-brand"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  <span>
                    <Highlight text={f.q} query={q} />
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-muted transition-transform group-open:rotate-180"
                  >
                    ⌄
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted">
                  <Highlight text={f.a} query={q} />
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <p className="border-t border-border pt-6 text-xs text-muted">
        ¿Tienes otra duda?{" "}
        <Link href={publicHref} target="_blank" className="underline">
          Revisa tu página pública
        </Link>{" "}
        o{" "}
        <Link href="/dashboard/soporte" className="underline">
          contáctanos directamente
        </Link>
        .
      </p>
    </div>
  );
}
