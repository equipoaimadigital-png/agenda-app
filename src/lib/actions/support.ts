"use server";

import { redirect } from "next/navigation";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { sendSupportEmail } from "@/lib/email";
import { SUPPORT_CATEGORIES } from "@/lib/support-categories";

export async function sendSupportRequest(
  _prev: { error?: string; sent?: boolean },
  formData: FormData
): Promise<{ error?: string; sent?: boolean }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const category = String(formData.get("category") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!SUPPORT_CATEGORIES.includes(category as (typeof SUPPORT_CATEGORIES)[number])) {
    return { error: "Elige una categoría." };
  }
  if (message.length < 10) return { error: "Cuéntanos un poco más — mínimo 10 caracteres." };

  const sent = await sendSupportEmail({
    businessName: professional.businessName,
    slug: professional.slug,
    professionalEmail: professional.email,
    professionalPhone: professional.phone,
    category,
    message,
  });

  return sent
    ? { sent: true }
    : { error: "No se pudo enviar tu mensaje. Intenta de nuevo o escríbenos directo a equipo.aimadigital@gmail.com." };
}
