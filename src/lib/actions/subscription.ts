"use server";

import { redirect } from "next/navigation";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { createSubscriptionInitPoint, createSubscriptionPaymentLink } from "@/lib/mercadopago";
import { isValidEmail } from "@/lib/validation";

export async function startSubscriptionCheckout(formData: FormData): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  // El `payer_email` de la suscripción debe ser el correo de la CUENTA DE
  // MERCADO PAGO del profesional — no necesariamente el que usó para
  // registrarse en la app. Si no coinciden, Mercado Pago muestra el checkout
  // pero deja el botón "Confirmar" deshabilitado. Por eso se pide explícito.
  const mpEmail = String(formData.get("mpEmail") || "").trim().toLowerCase();
  if (!isValidEmail(mpEmail)) {
    redirect(
      `/dashboard/suscripcion?error=${encodeURIComponent(
        "Ingresa el correo de tu cuenta de Mercado Pago."
      )}`
    );
  }

  const result = await createSubscriptionInitPoint({
    professionalId: professional.id,
    payerEmail: mpEmail,
    businessName: professional.businessName,
  });

  if ("error" in result) {
    redirect(`/dashboard/suscripcion?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.initPoint);
}

/**
 * Pago ÚNICO de 1 mes de plan. Camino para quien no puede usar cobro
 * recurrente (débito chileno): funciona con débito, crédito y efectivo.
 * No hay `payer_email` — MP usa el de quien pague. El acceso se extiende
 * cuando llega el webhook del pago aprobado.
 */
export async function startSubscriptionOneTimePayment(): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const result = await createSubscriptionPaymentLink({
    professionalId: professional.id,
    businessName: professional.businessName,
  });

  if ("error" in result) {
    redirect(`/dashboard/suscripcion?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.initPoint);
}
