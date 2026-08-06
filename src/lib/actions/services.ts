"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

export async function createService(formData: FormData) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const durationMin = Number(formData.get("durationMin") || 0);
  const priceRaw = String(formData.get("price") || "").trim();
  const price = priceRaw ? Number(priceRaw) : null;

  if (!name || !durationMin || durationMin <= 0) {
    return;
  }

  await prisma.service.create({
    data: {
      professionalId: professional.id,
      name,
      durationMin,
      price,
    },
  });

  revalidatePath("/dashboard/servicios");
}

export async function deleteService(serviceId: string) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  await prisma.service.deleteMany({
    where: { id: serviceId, professionalId: professional.id },
  });

  revalidatePath("/dashboard/servicios");
}
