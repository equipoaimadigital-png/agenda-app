"use server";

import { redirect } from "next/navigation";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { createSubscriptionInitPoint } from "@/lib/mercadopago";

export async function startSubscriptionCheckout(): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const result = await createSubscriptionInitPoint({
    professionalId: professional.id,
    payerEmail: professional.email,
    businessName: professional.businessName,
  });

  if ("error" in result) {
    redirect(`/dashboard/suscripcion?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.initPoint);
}
