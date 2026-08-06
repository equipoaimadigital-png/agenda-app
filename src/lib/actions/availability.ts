"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function createAvailability(formData: FormData) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");

  if (Number.isNaN(weekday) || !startTime || !endTime) {
    return;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return;
  }

  await prisma.availability.create({
    data: {
      professionalId: professional.id,
      weekday,
      startMinutes,
      endMinutes,
    },
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
