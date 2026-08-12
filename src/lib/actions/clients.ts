"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

/** Guarda o borra el cumpleaños ("MM-DD") de un cliente, identificado por teléfono. */
export async function saveClientBirthday(formData: FormData): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const phone = String(formData.get("phone") || "").trim();
  const month = Number(formData.get("month") || 0);
  const day = Number(formData.get("day") || 0);
  if (!phone) return;

  const birthday =
    month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;

  await prisma.client.upsert({
    where: { professionalId_phone: { professionalId: professional.id, phone } },
    create: { professionalId: professional.id, phone, birthday },
    update: { birthday },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
}
