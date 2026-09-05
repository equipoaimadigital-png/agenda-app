import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Preference } from "mercadopago";
import { SUBSCRIPTION_PRICE_ANNUAL_CLP, SUBSCRIPTION_PRICE_CLP } from "@/lib/subscription";

function getClient(): MercadoPagoConfig | null {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Crea (UNA sola vez) el PLAN de suscripción mensual en Mercado Pago. El
 * plan es la plantilla de cobro: monto, moneda y frecuencia. Se corre a
 * mano con `node --env-file=.env.local prisma/scripts/create-mp-plan.mjs`;
 * el id que devuelve se guarda en MERCADOPAGO_SUBSCRIPTION_PLAN_ID (Vercel
 * y .env.local).
 *
 * Con el plan, el profesional entra directo al checkout de Mercado Pago y
 * es MERCADO PAGO quien le pide el correo y la tarjeta — la app no pide
 * ningún dato antes.
 */
export async function createSubscriptionPlan(): Promise<
  { id: string; initPoint: string } | { error: string }
> {
  const client = getClient();
  if (!client) return { error: "Falta MERCADOPAGO_ACCESS_TOKEN." };

  try {
    const result = await new PreApprovalPlan(client).create({
      body: {
        reason: "Tu Hora Lista — Plan mensual",
        back_url: `${siteUrl()}/dashboard/suscripcion?pago=1`,
        status: "active",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: SUBSCRIPTION_PRICE_CLP,
          currency_id: "CLP",
        },
        payment_methods_allowed: {
          payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
        },
      },
    });
    if (!result.id || !result.init_point) {
      return { error: "Mercado Pago no devolvió un plan válido." };
    }
    return { id: result.id, initPoint: result.init_point };
  } catch (err) {
    console.error("Error creando el plan de suscripción en Mercado Pago:", JSON.stringify(err));
    return { error: "No se pudo crear el plan de suscripción." };
  }
}

/**
 * URL del checkout de suscripción (cobro automático) para ESTE profesional.
 * Se arma con el id del plan (env) + `external_reference` = id del
 * profesional, que Mercado Pago copia a la suscripción que se cree, para
 * que el webhook sepa a quién activar sin confiar en nada del navegador.
 * Devuelve null si todavía no se configuró el plan.
 */
export function subscriptionCheckoutUrl(professionalId: string): string | null {
  const planId = process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID;
  if (!planId) return null;
  const params = new URLSearchParams({
    preapproval_plan_id: planId,
    external_reference: professionalId,
  });
  return `https://www.mercadopago.cl/subscriptions/checkout?${params.toString()}`;
}

/**
 * Pago ÚNICO de 1 AÑO de plan, con el descuento anual (ver
 * SUBSCRIPTION_PRICE_ANNUAL_CLP). `external_reference` lleva el prefijo
 * "sub-annual:" para que el webhook extienda `subscriptionPaidUntil` 365
 * días en vez de 31. Solo tarjeta: se excluyen los medios de pago en
 * efectivo (ticket) y transferencia/depósito (atm).
 */
export async function createAnnualPaymentLink(params: {
  professionalId: string;
  businessName: string;
}): Promise<{ initPoint: string } | { error: string }> {
  const client = getClient();
  if (!client) return { error: "Mercado Pago no está configurado todavía." };

  try {
    const result = await new Preference(client).create({
      body: {
        items: [
          {
            id: `sub-annual-${params.professionalId}`,
            title: `Tu Hora Lista — 1 año de plan (${params.businessName})`,
            quantity: 1,
            unit_price: SUBSCRIPTION_PRICE_ANNUAL_CLP,
            currency_id: "CLP",
          },
        ],
        external_reference: `sub-annual:${params.professionalId}`,
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        },
        back_urls: {
          success: `${siteUrl()}/dashboard/suscripcion?pago=1`,
          pending: `${siteUrl()}/dashboard/suscripcion?pago=pendiente`,
          failure: `${siteUrl()}/dashboard/suscripcion?pago=error`,
        },
        notification_url: `${siteUrl()}/api/mercadopago/webhook`,
      },
    });
    if (!result.init_point) {
      return { error: "Mercado Pago no devolvió un link de pago válido." };
    }
    return { initPoint: result.init_point };
  } catch (err) {
    console.error("Error creando link de pago anual en Mercado Pago:", JSON.stringify(err));
    return { error: "No se pudo generar el link de pago. Intenta de nuevo." };
  }
}

export async function fetchPreapproval(preapprovalId: string) {
  const client = getClient();
  if (!client) return null;
  const preApproval = new PreApproval(client);
  return preApproval.get({ id: preapprovalId });
}
