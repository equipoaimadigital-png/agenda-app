"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

type FormState = { error?: string; success?: boolean };

function parseServiceIds(formData: FormData): string[] {
  return formData.getAll("serviceIds").map(String);
}

export async function createStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#2f4a3e");
  const serviceIds = parseServiceIds(formData);

  if (!name) return { error: "Escribe un nombre." };
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "El color no es válido." };

  await prisma.staff.create({
    data: {
      professionalId: professional.id,
      name,
      color,
      services: { connect: serviceIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function updateStaff(
  staffId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId: professional.id },
  });
  if (!staff) return { error: "No encontramos a este profesional." };

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#2f4a3e");
  const serviceIds = parseServiceIds(formData);

  if (!name) return { error: "Escribe un nombre." };
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "El color no es válido." };

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      name,
      color,
      services: { set: serviceIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function toggleStaffActive(staffId: string): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId: professional.id },
  });
  if (!staff) return { error: "No encontramos a este profesional." };

  if (staff.active) {
    const activeCount = await prisma.staff.count({
      where: { professionalId: professional.id, active: true },
    });
    if (activeCount <= 1) {
      return { error: "No puedes pausar a tu único profesional activo — tu agenda quedaría sin nadie disponible." };
    }
  }

  await prisma.staff.update({ where: { id: staffId }, data: { active: !staff.active } });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
  return {};
}
