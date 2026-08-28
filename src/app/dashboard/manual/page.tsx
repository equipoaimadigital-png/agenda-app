import { getCurrentProfessional } from "@/lib/auth-helpers";
import { IconBook } from "@/components/dashboard/ManualIcons";
import { ManualExplorer } from "@/components/dashboard/ManualExplorer";

export default async function ManualPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-12">
        <div aria-hidden className="seal-texture absolute inset-0" />
        <div className="relative flex items-start gap-4">
          <div
            aria-hidden
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand ring-2 ring-white/15 sm:flex"
          >
            <IconBook className="h-7 w-7 text-brand-foreground" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-white/60">Manual de uso</p>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Todo lo que puedes hacer en Tu Hora Lista
            </h1>
            <p className="mt-3 max-w-lg text-sm text-white/70 sm:text-base">
              Guía rápida por secciones. Busca lo que necesites, abre solo lo que te interese y
              vuelve cuando quieras.
            </p>
          </div>
        </div>
      </div>

      <ManualExplorer publicHref={`/reservar/${professional.slug}`} />
    </div>
  );
}
