"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

export async function createService(formData: FormData) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
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
      description,
      durationMin,
      price,
    },
  });

  revalidatePath("/dashboard/servicios");
}

export async function toggleServiceActive(serviceId: string) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id },
  });
  if (!service) return;

  await prisma.service.update({
    where: { id: service.id },
    data: { active: !service.active },
  });

  revalidatePath("/dashboard/servicios");
}

export async function deleteService(serviceId: string) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  // Si el servicio tiene reservas históricas, se desactiva en vez de borrar
  const bookingsCount = await prisma.booking.count({ where: { serviceId } });
  if (bookingsCount > 0) {
    await prisma.service.updateMany({
      where: { id: serviceId, professionalId: professional.id },
      data: { active: false },
    });
  } else {
    await prisma.service.deleteMany({
      where: { id: serviceId, professionalId: professional.id },
    });
  }

  revalidatePath("/dashboard/servicios");
}
