import { MercadoPagoConfig, PreApproval } from "mercadopago";

const SUBSCRIPTION_PRICE_CLP = 12000;

function getClient(): MercadoPagoConfig | null {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Crea una suscripción (Preapproval) de cobro recurrente mensual y devuelve
 * el link de checkout de Mercado Pago para redirigir al profesional a
 * autorizarla. `external_reference` es el id del Professional — así el
 * webhook sabe a quién activar sin tener que confiar en nada que venga del
 * navegador.
 */
export async function createSubscriptionInitPoint(params: {
  professionalId: string;
  payerEmail: string;
  businessName: string;
}): Promise<{ initPoint: string; preapprovalId: string } | { error: string }> {
  const client = getClient();
  if (!client) return { error: "Mercado Pago no está configurado todavía." };

  const preApproval = new PreApproval(client);

  try {
    const result = await preApproval.create({
      body: {
        reason: `Tu Hora Lista — Plan mensual (${params.businessName})`,
        external_reference: params.professionalId,
        payer_email: params.payerEmail,
        back_url: `${siteUrl()}/dashboard/suscripcion?resultado=1`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: SUBSCRIPTION_PRICE_CLP,
          currency_id: "CLP",
        },
        status: "pending",
      },
    });

    if (!result.init_point || !result.id) {
      return { error: "Mercado Pago no devolvió un link de pago válido." };
    }
    return { initPoint: result.init_point, preapprovalId: result.id };
  } catch (err) {
    console.error("Error creando suscripción en Mercado Pago:", err);
    return { error: "No se pudo iniciar el pago. Intenta de nuevo en unos minutos." };
  }
}

export async function fetchPreapproval(preapprovalId: string) {
  const client = getClient();
  if (!client) return null;
  const preApproval = new PreApproval(client);
  return preApproval.get({ id: preapprovalId });
}

export { SUBSCRIPTION_PRICE_CLP };
