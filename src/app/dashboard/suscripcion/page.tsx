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
  startSubscriptionOneTimePayment,
} from "@/lib/actions/subscription";
import { formatDateLong } from "@/lib/dates";
import { messagingQuota } from "@/lib/messaging-quota";

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
        <div className="flex flex-col gap-4">
          {/* Opción 1 — pago manual, sirve con débito */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
            <p className="font-medium">Pagar 1 mes</p>
            <p className="text-sm text-muted">
              Un pago único de {formatPrice(SUBSCRIPTION_PRICE_CLP)}. Sirve con{" "}
              <strong>débito, crédito o efectivo</strong>. Renuevas tú cada mes (te avisamos).
            </p>
            <form action={startSubscriptionOneTimePayment}>
              <button
                type="submit"
                className="self-start bg-brand text-brand-foreground rounded-lg px-4 py-3 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
              >
                Pagar {formatPrice(SUBSCRIPTION_PRICE_CLP)} por 1 mes
              </button>
            </form>
          </div>

          {/* Opción 1b — pago anual, con descuento */}
          <div className="relative bg-surface border border-brass rounded-xl p-4 flex flex-col gap-2">
            <span className="absolute -top-2.5 left-4 text-xs font-semibold bg-brass text-white rounded-full px-2.5 py-0.5">
              2 meses gratis
            </span>
            <p className="font-medium mt-1">Pagar 1 año</p>
            <p className="text-sm text-muted">
              Un pago único de {formatPrice(SUBSCRIPTION_PRICE_ANNUAL_CLP)} — te ahorras{" "}
              <strong>{formatPrice(ANNUAL_SAVINGS_CLP)}</strong> frente a pagar mes a mes. Sirve
              con <strong>débito, crédito o efectivo</strong>. Tu plan queda al día por 12 meses.
            </p>
            <form action={startAnnualSubscriptionPayment}>
              <button
                type="submit"
                className="self-start bg-brass text-white rounded-lg px-4 py-3 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
              >
                Pagar {formatPrice(SUBSCRIPTION_PRICE_ANNUAL_CLP)} por 1 año
              </button>
            </form>
          </div>

          {/* Opción 2 — cobro automático, requiere crédito */}
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
            <div>
              <p className="font-medium">Cobro automático cada mes</p>
              <p className="text-sm text-muted">
                Se cobra solo, no tienes que acordarte. Necesita{" "}
                <strong>tarjeta de crédito</strong> — varias tarjetas de débito de bancos chilenos
                no permiten el cobro recurrente.
              </p>
            </div>
            <form action={startSubscriptionCheckout} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="mpEmail" className="text-sm font-medium">
                  Correo de tu cuenta de Mercado Pago
                </label>
                <input
                  id="mpEmail"
                  name="mpEmail"
                  type="email"
                  required
                  defaultValue={professional.email}
                  placeholder="tucorreo@ejemplo.com"
                  className="border border-border rounded-lg px-3 py-2.5 max-w-sm"
                />
                <p className="text-xs text-muted">
                  Debe ser el correo con el que inicias sesión en Mercado Pago, o el checkout no
                  te deja confirmar.
                </p>
              </div>
              <button
                type="submit"
                className="self-start border border-border bg-surface rounded-lg px-4 py-3 font-medium hover:border-brand active:scale-[0.98]"
              >
                Activar cobro automático
              </button>
            </form>
          </div>

          <p className="text-xs text-muted">
            Te llevamos al checkout seguro de Mercado Pago. Nunca vemos ni guardamos los datos de
            tu tarjeta.
          </p>
        </div>
      )}
    </div>
  );
}
