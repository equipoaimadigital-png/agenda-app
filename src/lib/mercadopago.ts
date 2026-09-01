import { MercadoPagoConfig, PreApproval, Preference } from "mercadopago";
import { SUBSCRIPTION_PRICE_CLP } from "@/lib/subscription";

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
    // El SDK de MP mete el detalle útil en `.cause` o `.message` — se loguea
    // completo para poder diagnosticar (payer_email inválido, moneda, etc.).
    const detail =
      err && typeof err === "object"
        ? // @ts-expect-error — forma variable del error del SDK
          err.cause ?? err.message ?? err
        : err;
    console.error("Error creando suscripción en Mercado Pago:", JSON.stringify(detail));
    return { error: "No se pudo iniciar el pago. Revisa el correo de Mercado Pago e intenta de nuevo." };
  }
}

/**
 * Pago ÚNICO del plan (no recurrente), para quien no puede usar cobro
 * automático (débito chileno). Cada pago aprobado extiende
 * `subscriptionPaidUntil` ~31 días desde el webhook. `external_reference`
 * lleva el prefijo "sub:" para que el webhook lo distinga de un depósito.
 */
export async function createSubscriptionPaymentLink(params: {
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
            id: `sub-${params.professionalId}`,
            title: `Tu Hora Lista — 1 mes de plan (${params.businessName})`,
            quantity: 1,
            unit_price: SUBSCRIPTION_PRICE_CLP,
            currency_id: "CLP",
          },
        ],
        external_reference: `sub:${params.professionalId}`,
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
    console.error("Error creando link de pago del plan en Mercado Pago:", JSON.stringify(err));
    return { error: "No se pudo generar el link de pago. Intenta de nuevo." };
  }
}

export async function fetchPreapproval(preapprovalId: string) {
  const client = getClient();
  if (!client) return null;
  const preApproval = new PreApproval(client);
  return preApproval.get({ id: preapprovalId });
}
