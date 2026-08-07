"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { timeToMinutes } from "@/lib/dates";

export async function createAvailability(formData: FormData) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  // Permite crear el mismo bloque para varios días a la vez (checkboxes "weekday")
  const weekdays = formData
    .getAll("weekday")
    .map(Number)
    .filter((d) => d >= 0 && d <= 6);
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");

  if (weekdays.length === 0 || !startTime || !endTime) {
    return;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    return;
  }

  await prisma.availability.createMany({
    data: weekdays.map((weekday) => ({
      professionalId: professional.id,
      weekday,
      startMinutes,
      endMinutes,
    })),
  });

  revalidatePath("/dashboard/disponibilidad");
}

export async function deleteAvailability(availabilityId: string) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  await prisma.availability.deleteMany({
    where: { id: availabilityId, professionalId: professional.id },
  });

  revalidatePath("/dashboard/disponibilidad");
}
