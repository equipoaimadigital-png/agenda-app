import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { getReactivationData, type ReactivationClient } from "@/lib/reactivation";
import { ReactivationComposer } from "@/components/dashboard/ReactivationComposer";

function days(n: number): string {
  return n === 1 ? "1 día" : `${n} días`;
}

function ClientRow({ c }: { c: ReactivationClient }) {
  return (
    <li className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium truncate">
          {c.name || "Cliente"}
          {c.oneTimeOnly && (
            <span className="ml-2 text-xs bg-warning-soft text-warning rounded-full px-2 py-0.5">
              Vino 1 vez
            </span>
          )}
        </p>
        <p className="text-xs text-muted">
          Sin venir hace <strong className="text-stone">{days(c.daysSince)}</strong>
          {c.visitCount >= 2 && ` · suele venir cada ~${days(c.expectedIntervalDays)}`}
          {` · ${c.visitCount} visita${c.visitCount === 1 ? "" : "s"}`}
        </p>
      </div>
      {!c.email && (
        <span className="shrink-0 text-xs text-muted bg-paper border border-border rounded-full px-2 py-0.5">
          sin email
        </span>
      )}
    </li>
  );
}

export default async function ReactivacionPage() {
  const professional = await requireDashboardAccess();
  const data = await getReactivationData(professional.id);

  const header = (
    <div>
      <h1 className="text-2xl font-semibold font-display">Reactivación</h1>
      <p className="text-sm text-stone mt-1">
        Clientes que llevan más tiempo del habitual sin venir, según el ritmo de cada uno.
      </p>
    </div>
  );

  if (!data.ready) {
    const missing: string[] = [];
    if (data.historyDays < 30) missing.push(`al menos 30 días de historial (llevas ${data.historyDays})`);
    if (data.eligibleClients < 10)
      missing.push(`al menos 10 clientes con visitas (tienes ${data.eligibleClients})`);
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        {header}
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3" aria-hidden>
            🌱
          </p>
          <p className="font-medium">Todavía estamos juntando datos</p>
          <p className="text-sm text-muted mt-1">
            Para sugerir a quién reactivar necesitamos {missing.join(" y ")}. Vuelve más adelante
            — se arma solo con cada reserva.
          </p>
        </div>
      </div>
    );
  }

  const overdueWithEmail = data.overdue.filter((c) => c.email).length;
  const soonWithEmail = data.soon.filter((c) => c.email).length;
  const overdueNoEmail = data.overdue.length - overdueWithEmail;

  let suggestion: string;
  if (data.overdue.length === 0) {
    suggestion =
      "Ningún cliente está atrasado según su ritmo habitual. Vuelve a mirar en unos días.";
  } else {
    const bits = [
      `${data.overdue.length} cliente${data.overdue.length === 1 ? "" : "s"} ya deberían haber vuelto`,
    ];
    if (data.oneTimeOverdue > 0) bits.push(`${data.oneTimeOverdue} vinieron una sola vez`);
    suggestion =
      bits.join(" · ") +
      ". Lo más efectivo suele ser un correo corto invitándolos a agendar, sin descuento agresivo.";
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {header}

      <div className="bg-brand-soft border border-brand/30 rounded-2xl p-4">
        <p className="text-sm font-medium text-ink">{suggestion}</p>
        {overdueNoEmail > 0 && (
          <p className="text-xs text-muted mt-1.5">
            {overdueNoEmail} de ellos no tienen email cargado — a esos escríbeles por WhatsApp
            desde{" "}
            <Link href="/dashboard/clientes" className="underline">
              Clientes
            </Link>
            .
          </p>
        )}
      </div>

      {data.overdue.length > 0 && overdueWithEmail > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Escribir a los clientes atrasados</h2>
          <ReactivationComposer
            businessName={professional.businessName}
            overdueWithEmail={overdueWithEmail}
            soonWithEmail={soonWithEmail}
          />
        </section>
      )}

      {data.overdue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">
            Atrasados <span className="text-muted font-normal">({data.overdue.length})</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {data.overdue.map((c) => (
              <ClientRow key={c.phone} c={c} />
            ))}
          </ul>
        </section>
      )}

      {data.soon.length > 0 && (
        <details className="bg-surface border border-border rounded-xl p-4">
          <summary className="text-sm font-medium cursor-pointer">
            Por atrasarse pronto ({data.soon.length})
          </summary>
          <ul className="flex flex-col gap-2 mt-3">
            {data.soon.map((c) => (
              <ClientRow key={c.phone} c={c} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
