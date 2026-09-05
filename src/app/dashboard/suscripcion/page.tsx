import { getCurrentProfessional } from "@/lib/auth-helpers";
import {
  ANNUAL_SAVINGS_CLP,
  hasDashboardAccess,
  pastDueGraceDaysLeft,
  SUBSCRIPTION_PRICE_ANNUAL_CLP,
  SUBSCRIPTION_PRICE_CLP,
} from "@/lib/subscription";
import {
  startAnnualSubscriptionPayment,
  startSubscriptionCheckout,
} from "@/lib/actions/subscription";
import { formatDateLong } from "@/lib/dates";
import { messagingQuota } from "@/lib/messaging-quota";
import { PlanTabs } from "./PlanTabs";

function formatPrice(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type PageProps = { searchParams: Promise<{ error?: string; pago?: string }> };

export default async function SuscripcionPage({ searchParams }: PageProps) {
  const professional = await getCurrentProfessional();
  if (!professional) return null;
  const { error, pago } = await searchParams;

  const quota = await messagingQuota(professional.id);
  const active = hasDashboardAccess(professional);
  const isExempt = professional.billingExempt;
  const isRecurringActive = professional.subscriptionStatus === "ACTIVE";
  const paidUntil = professional.subscriptionPaidUntil;
  const manualActive = !!paidUntil && new Date() < paidUntil;
  const trialActive =
    professional.subscriptionStatus === "TRIAL" && active && !manualActive && !isExempt;
  const pastDueGrace = pastDueGraceDaysLeft(professional); // número si está en gracia, null si no
  const showPaymentOptions = !isRecurringActive && !isExempt;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Suscripción</h1>
        <p className="text-sm text-muted mt-1">
          {formatPrice(SUBSCRIPTION_PRICE_CLP)}/mes para seguir usando tu panel de Tu Hora Lista.
        </p>
      </div>

      <div
        className={`border rounded-xl p-4 ${
          quota.overLimit
            ? "bg-warning-soft border-border"
            : "bg-surface border-border"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Mensajes de este mes</p>
          <p className="text-sm font-numeric">
            {quota.used.toLocaleString("es-CL")} / {quota.limit.toLocaleString("es-CL")}
          </p>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={quota.overLimit ? "h-full bg-warning" : "h-full bg-brand"}
            style={{ width: `${Math.min(100, Math.round(quota.pct * 100))}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {quota.overLimit
            ? "Llegaste al tope de SMS y WhatsApp de este mes. Tus clientes siguen recibiendo el correo de confirmación y recordatorio. El contador se reinicia el día 1. Si necesitas más, escríbenos a soporte@tuhoralista.com."
            : "Incluye SMS y WhatsApp de confirmación y recordatorio. El correo no cuenta y no tiene tope. Se reinicia el día 1 de cada mes."}
        </p>
      </div>

      {pago === "1" && (
        <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
          Pago recibido. Si no ves tu plan al día en un minuto, recarga la página.
        </p>
      )}
      {pago === "pendiente" && (
        <p className="text-sm text-warning bg-warning-soft rounded-lg px-3 py-2">
          Tu pago quedó pendiente de aprobación. En cuanto se acredite, tu plan se activa solo.
        </p>
      )}
      {pago === "error" && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
          El pago no se completó. Puedes intentar de nuevo con otro medio.
        </p>
      )}

      {isExempt && (
        <div className="bg-brand-soft border border-border rounded-xl p-4">
          <p className="font-medium">Cuenta de administración</p>
          <p className="text-sm text-muted mt-1">
            Esta cuenta está exenta de cobro. El panel nunca se bloquea.
          </p>
        </div>
      )}

      {isRecurringActive && !isExempt && (
        <div className="bg-success-soft border border-border rounded-xl p-4">
          <p className="font-medium text-success">✓ Tu suscripción automática está activa</p>
          <p className="text-sm text-muted mt-1">
            El cobro se realiza solo cada mes a través de Mercado Pago. Si quieres cancelarla,
            puedes hacerlo desde tu cuenta de Mercado Pago.
          </p>
        </div>
      )}

      {!isRecurringActive && manualActive && (
        <div className="bg-success-soft border border-border rounded-xl p-4">
          <p className="font-medium text-success">✓ Tu plan está al día</p>
          <p className="text-sm text-muted mt-1">
            Pagado hasta el{" "}
            <strong className="capitalize">{formatDateLong(toDateStr(paidUntil))}</strong>. Antes de
            esa fecha, vuelve acá y paga otro mes para no quedarte sin panel.
          </p>
        </div>
      )}

      {pastDueGrace !== null && !isExempt && (
        <div className="bg-danger-soft border border-border rounded-xl p-4">
          <p className="font-medium text-danger">No pudimos cobrar tu suscripción</p>
          <p className="text-sm text-muted mt-1">
            {pastDueGrace <= 0
              ? "Tu panel se bloqueará muy pronto."
              : `Te ${pastDueGrace === 1 ? "queda" : "quedan"} ${pastDueGrace} día${
                  pastDueGrace === 1 ? "" : "s"
                } de acceso mientras lo resuelves.`}{" "}
            Actualiza tu tarjeta en tu cuenta de Mercado Pago para que el cobro automático se
            reanude, o paga un mes ahora con los botones de abajo. Tu página pública de reservas
            sigue funcionando normal para tus clientes.
          </p>
        </div>
      )}

      {trialActive && (
        <div className="bg-brand-soft border border-border rounded-xl p-4">
          <p className="font-medium">Estás en tu prueba gratis</p>
          <p className="text-sm text-muted mt-1">
            Termina el{" "}
            <strong className="capitalize">
              {professional.trialEndsAt ? formatDateLong(toDateStr(professional.trialEndsAt)) : "—"}
            </strong>
            . Puedes activar tu plan antes o esperar a que termine.
          </p>
        </div>
      )}

      {!active && !isRecurringActive && !manualActive && (
        <div className="bg-warning-soft border border-border rounded-xl p-4">
          <p className="font-medium text-warning">
            {professional.subscriptionStatus === "PAST_DUE"
              ? "Hubo un problema con tu último cobro"
              : "Tu prueba gratis terminó"}
          </p>
          <p className="text-sm text-muted mt-1">
            Tu panel está bloqueado hasta que actives el plan. Tranquilo: tu página pública de
            reservas sigue funcionando normal para tus clientes.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}

      {showPaymentOptions && (
        <PlanTabs
          monthlyPrice={SUBSCRIPTION_PRICE_CLP}
          annualPrice={SUBSCRIPTION_PRICE_ANNUAL_CLP}
          annualSavings={ANNUAL_SAVINGS_CLP}
          startRecurring={startSubscriptionCheckout}
          startAnnual={startAnnualSubscriptionPayment}
        />
      )}
    </div>
  );
}
