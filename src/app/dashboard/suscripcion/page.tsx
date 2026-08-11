import { getCurrentProfessional } from "@/lib/auth-helpers";
import { hasDashboardAccess, SUBSCRIPTION_PRICE_CLP } from "@/lib/subscription";
import { startSubscriptionCheckout } from "@/lib/actions/subscription";
import { formatDateLong } from "@/lib/dates";

function formatPrice(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function SuscripcionPage({ searchParams }: PageProps) {
  const professional = await getCurrentProfessional();
  if (!professional) return null;
  const { error } = await searchParams;

  const active = hasDashboardAccess(professional);
  const trialActive = professional.subscriptionStatus === "TRIAL" && active;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Suscripción</h1>
        <p className="text-sm text-muted mt-1">
          {formatPrice(SUBSCRIPTION_PRICE_CLP)}/mes para seguir usando tu panel de Tú Agenda.
        </p>
      </div>

      {professional.subscriptionStatus === "ACTIVE" && (
        <div className="bg-success-soft border border-border rounded-xl p-4">
          <p className="font-medium text-success">✓ Tu suscripción está activa</p>
          <p className="text-sm text-muted mt-1">
            El cobro se realiza automáticamente cada mes a través de Mercado Pago. Si
            quieres cancelarla, puedes hacerlo desde tu cuenta de Mercado Pago.
          </p>
        </div>
      )}

      {trialActive && (
        <div className="bg-brand-soft border border-border rounded-xl p-4">
          <p className="font-medium">Estás en tu prueba gratis</p>
          <p className="text-sm text-muted mt-1">
            Termina el{" "}
            <strong className="capitalize">
              {professional.trialEndsAt ? formatDateLong(
                `${professional.trialEndsAt.getFullYear()}-${String(professional.trialEndsAt.getMonth() + 1).padStart(2, "0")}-${String(professional.trialEndsAt.getDate()).padStart(2, "0")}`
              ) : "—"}
            </strong>
            . Puedes suscribirte antes o esperar a que termine.
          </p>
        </div>
      )}

      {!active && professional.subscriptionStatus !== "ACTIVE" && (
        <div className="bg-warning-soft border border-border rounded-xl p-4">
          <p className="font-medium text-warning">
            {professional.subscriptionStatus === "PAST_DUE"
              ? "Hubo un problema con tu último cobro"
              : "Tu prueba gratis terminó"}
          </p>
          <p className="text-sm text-muted mt-1">
            Tu panel está bloqueado hasta que actives la suscripción. Tranquilo: tu página
            pública de reservas sigue funcionando normal para tus clientes.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}

      {professional.subscriptionStatus !== "ACTIVE" && (
        <form action={startSubscriptionCheckout}>
          <button
            type="submit"
            className="bg-brand text-brand-foreground rounded-lg px-4 py-3 font-medium"
          >
            Suscribirme por {formatPrice(SUBSCRIPTION_PRICE_CLP)}/mes
          </button>
          <p className="text-xs text-muted mt-2">
            Te llevamos al checkout seguro de Mercado Pago. Nunca vemos ni guardamos los
            datos de tu tarjeta.
          </p>
        </form>
      )}
    </div>
  );
}
