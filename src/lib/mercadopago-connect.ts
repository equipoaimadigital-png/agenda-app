import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const MP_OAUTH_AUTHORIZE_URL = "https://auth.mercadopago.com/authorization";
const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function redirectUri(): string {
  return `${siteUrl()}/api/mercadopago/oauth/callback`;
}

/**
 * URL a la que se manda al profesional para que autorice, en su propia
 * sesión de Mercado Pago, la conexión de SU cuenta (nunca la de la
 * plataforma). `state` lleva el id del profesional — se vuelve a verificar
 * contra la sesión activa al volver del callback, para que un código de
 * autorización nunca pueda terminar asociado a un negocio distinto del que
 * lo inició.
 */
export function getConnectUrl(professionalId: string): string | null {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: redirectUri(),
    state: professionalId,
  });
  return `${MP_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

type TokenExchangeResult =
  | { userId: string; accessToken: string; refreshToken: string }
  | { error: string };

/** Cambia el código de autorización de un solo uso por las credenciales reales de la cuenta. */
export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { error: "Mercado Pago Connect no está configurado." };
  }

  try {
    const res = await fetch(MP_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token || !data.user_id) {
      console.error("Error intercambiando código OAuth de Mercado Pago:", data);
      return { error: "Mercado Pago rechazó la conexión." };
    }
    return {
      userId: String(data.user_id),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (err) {
    console.error("Error de red conectando con Mercado Pago:", err);
    return { error: "No se pudo conectar con Mercado Pago." };
  }
}

/**
 * Crea el checkout de pago único del depósito, usando el access token DEL
 * PROFESIONAL (nunca el de la plataforma) — así el dinero cae directo en su
 * cuenta. `external_reference` es el id de la reserva (interno, no el
 * manageToken que ve el cliente), para que el webhook sepa cuál confirmar
 * sin tener que confiar en nada que venga del navegador.
 */
export async function createDepositPreference(params: {
  professionalAccessToken: string;
  bookingId: string;
  manageToken: string;
  amount: number;
  serviceName: string;
  businessName: string;
  payerEmail?: string | null;
}): Promise<{ initPoint: string } | { error: string }> {
  const client = new MercadoPagoConfig({ accessToken: params.professionalAccessToken });
  const preference = new Preference(client);
  const backUrl = `${siteUrl()}/reserva/${params.manageToken}`;

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: params.bookingId,
            title: `Depósito — ${params.serviceName} (${params.businessName})`,
            quantity: 1,
            unit_price: params.amount,
            currency_id: "CLP",
          },
        ],
        external_reference: params.bookingId,
        payer: params.payerEmail ? { email: params.payerEmail } : undefined,
        back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
        auto_return: "approved",
        notification_url: `${siteUrl()}/api/mercadopago/webhook`,
      },
    });

    if (!result.init_point) {
      return { error: "Mercado Pago no devolvió un link de pago válido." };
    }
    return { initPoint: result.init_point };
  } catch (err) {
    console.error("Error creando preferencia de depósito en Mercado Pago:", err);
    return { error: "No se pudo iniciar el cobro del depósito." };
  }
}

/**
 * Reconsulta un pago directo a la API de Mercado Pago (nunca confiar en el
 * cuerpo del webhook). Usa el access token del profesional dueño de la
 * reserva — el mismo con el que se creó la preferencia.
 */
export async function fetchPayment(accessToken: string, paymentId: string) {
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
