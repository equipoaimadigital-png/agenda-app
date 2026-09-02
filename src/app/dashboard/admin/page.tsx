import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { SUBSCRIPTION_PRICE_CLP } from "@/lib/subscription";
import { formatDateLong } from "@/lib/dates";
import { monthWindowUTC } from "@/lib/messaging-quota";

export const metadata: Metadata = { title: "Administración" };

// Panel interno de operación — solo cuentas exentas (administración de la
// plataforma). Muestra el embudo de suscripciones, MRR estimado y las
// pruebas que están por vencer. Solo lectura.

type Bucket =
  | "exenta"
  | "recurrente"
  | "manual"
  | "prueba"
  | "prueba_vencida"
  | "atrasada"
  | "cancelada"
  | "otro";

const BUCKET_LABEL: Record<Bucket, string> = {
  exenta: "Exentas (admin)",
  recurrente: "Pagando · cobro automático",
  manual: "Pagando · pago manual al día",
  prueba: "En prueba gratis",
  prueba_vencida: "Prueba vencida sin pagar",
  atrasada: "Pago atrasado",
  cancelada: "Canceladas",
  otro: "Otro",
};

function classify(p: {
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionPaidUntil: Date | null;
  billingExempt: boolean;
}): Bucket {
  const now = Date.now();
  if (p.billingExempt) return "exenta";
  if (p.subscriptionStatus === "ACTIVE") return "recurrente";
  if (p.subscriptionPaidUntil && p.subscriptionPaidUntil.getTime() > now) return "manual";
  if (p.subscriptionStatus === "TRIAL") {
    if (!p.trialEndsAt || p.trialEndsAt.getTime() > now) return "prueba";
    return "prueba_vencida";
  }
  if (p.subscriptionStatus === "PAST_DUE") return "atrasada";
  if (p.subscriptionStatus === "CANCELLED") return "cancelada";
  return "otro";
}

function money(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function AdminPage() {
  const me = await getCurrentProfessional();
  if (!me?.billingExempt) notFound();

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const days30Ago = new Date(now.getTime() - 30 * 86_400_000);
  const monthStart = monthWindowUTC(now).start;

  const [pros, totalClients, totalBookings, bookings30, messagesThisMonth] = await Promise.all([
    prisma.professional.findMany({
      select: {
        id: true,
        businessName: true,
        email: true,
        createdAt: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionPaidUntil: true,
        billingExempt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: days30Ago } } }),
    prisma.messageLog.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const counts: Record<Bucket, number> = {
    exenta: 0,
    recurrente: 0,
    manual: 0,
    prueba: 0,
    prueba_vencida: 0,
    atrasada: 0,
    cancelada: 0,
    otro: 0,
  };
  for (const p of pros) counts[classify(p)]++;

  const paying = counts.recurrente + counts.manual;
  const mrr = paying * SUBSCRIPTION_PRICE_CLP;
  const signups30 = pros.filter((p) => p.createdAt >= days30Ago).length;
  // Conversión: de las cuentas que ya "decidieron" (pagan, o se fueron sin
  // pagar), qué fracción paga. Ignora las que siguen en prueba.
  const churned = counts.prueba_vencida + counts.cancelada;
  const decided = paying + churned;
  const conversionPct = decided > 0 ? Math.round((paying / decided) * 100) : null;

  const expiringSoon = pros
    .filter(
      (p) =>
        !p.billingExempt &&
        p.subscriptionStatus === "TRIAL" &&
        p.trialEndsAt &&
        p.trialEndsAt >= now &&
        p.trialEndsAt <= in7Days
    )
    .sort((a, b) => (a.trialEndsAt!.getTime() - b.trialEndsAt!.getTime()));

  const recent = pros.slice(0, 12);

  const bigStats = [
    { label: "MRR estimado", value: money(mrr), hint: `${paying} cuentas pagando` },
    { label: "En prueba gratis", value: String(counts.prueba), hint: `${counts.prueba_vencida} vencidas sin pagar` },
    { label: "Altas últimos 30 días", value: String(signups30), hint: `${pros.length} cuentas en total` },
    { label: "Reservas últimos 30 días", value: bookings30.toLocaleString("es-CL"), hint: `${totalBookings.toLocaleString("es-CL")} históricas` },
    { label: "SMS + WhatsApp este mes", value: messagesThisMonth.toLocaleString("es-CL"), hint: "toda la plataforma · costo Twilio" },
    {
      label: "Conversión a pago",
      value: conversionPct === null ? "—" : `${conversionPct}%`,
      hint: `${paying} pagan · ${churned} se fueron sin pagar`,
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Administración</h1>
        <p className="text-sm text-muted mt-1">
          Vista interna de la plataforma. Solo la ven las cuentas exentas de cobro.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {bigStats.map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-2xl font-semibold font-display mt-1">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Embudo de suscripciones
        </h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {(Object.keys(BUCKET_LABEL) as Bucket[])
            .filter((b) => counts[b] > 0)
            .map((b) => (
              <div key={b} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm">{BUCKET_LABEL[b]}</span>
                <span className="text-sm font-semibold font-numeric">{counts[b]}</span>
              </div>
            ))}
        </div>
        <p className="text-xs text-muted">
          MRR estimado = (cobro automático + pago manual al día) × {money(SUBSCRIPTION_PRICE_CLP)}.
          No descuenta comisiones de Mercado Pago ni cancelaciones a mitad de mes.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Pruebas que vencen en 7 días ({expiringSoon.length})
        </h2>
        {expiringSoon.length === 0 ? (
          <p className="text-sm text-muted">Ninguna prueba vence esta semana.</p>
        ) : (
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {expiringSoon.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.businessName}</p>
                  <p className="text-xs text-muted truncate">{p.email}</p>
                </div>
                <span className="text-xs text-muted whitespace-nowrap capitalize">
                  {formatDateLong(toDateStr(p.trialEndsAt!))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Últimas altas
        </h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {recent.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.businessName}</p>
                <p className="text-xs text-muted truncate">{p.email}</p>
              </div>
              <div className="text-right whitespace-nowrap">
                <p className="text-xs text-muted capitalize">
                  {formatDateLong(toDateStr(p.createdAt))}
                </p>
                <p className="text-[11px] text-muted">{BUCKET_LABEL[classify(p)]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        {pros.length} profesionales · {totalClients.toLocaleString("es-CL")} clientes ·{" "}
        {totalBookings.toLocaleString("es-CL")} reservas en la plataforma.
      </p>
    </div>
  );
}
