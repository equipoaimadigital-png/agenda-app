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
  const birthdayRaw = String(formData.get("birthday") || "").trim();
  if (!phone) return;

  // El input type="date" manda "YYYY-MM-DD" — solo guardamos mes y día.
  const match = birthdayRaw.match(/^\d{4}-(\d{2}-\d{2})$/);
  const birthday = match ? match[1] : null;

  await prisma.client.upsert({
    where: { professionalId_phone: { professionalId: professional.id, phone } },
    create: { professionalId: professional.id, phone, birthday },
    update: { birthday },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
}
