"use server";

import { redirect } from "next/navigation";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { createAnnualPaymentLink, subscriptionCheckoutUrl } from "@/lib/mercadopago";

/**
 * Cobro automático mensual. Manda al profesional al checkout de suscripción
 * de Mercado Pago ligado a NUESTRO plan mensual. Mercado Pago le pide ahí
 * su correo y su tarjeta — la app no pide nada antes. `external_reference`
 * (el id del profesional) viaja en la URL para que el webhook sepa a quién
 * activar cuando la suscripción quede autorizada.
 */
export async function startSubscriptionCheckout(): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const url = subscriptionCheckoutUrl(professional.id);
  if (!url) {
    redirect(
      `/dashboard/suscripcion?error=${encodeURIComponent(
        "El cobro automático no está disponible todavía. Puedes pagar el año completo, o escríbenos a soporte@tuhoralista.com."
      )}`
    );
  }
  redirect(url);
}

/**
 * Pago ÚNICO de 1 AÑO de plan, con el descuento anual (2 meses gratis).
 * Funciona con débito o crédito — no necesita cuenta de Mercado Pago ni
 * cobro recurrente. El acceso se extiende 365 días cuando llega el webhook
 * del pago aprobado.
 */
export async function startAnnualSubscriptionPayment(): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const result = await createAnnualPaymentLink({
    professionalId: professional.id,
    businessName: professional.businessName,
  });

  if ("error" in result) {
    redirect(`/dashboard/suscripcion?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.initPoint);
}
