"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { MAX_ACTIVE_STAFF } from "@/lib/staff-constants";

type FormState = { error?: string; success?: boolean };

function parseServiceIds(formData: FormData): string[] {
  return formData.getAll("serviceIds").map(String);
}

/**
 * Filtra a solo los serviceIds que de verdad pertenecen a este profesional.
 * Sin esto, un request armado a mano con el id de un servicio ajeno crearía
 * una fila fantasma en la tabla intermedia — inofensiva en la práctica
 * (loadBookingContext siempre re-filtra por professionalId), pero no hay
 * razón para permitirla.
 */
async function ownedServiceIds(professionalId: string, serviceIds: string[]): Promise<string[]> {
  if (serviceIds.length === 0) return [];
  const owned = await prisma.service.findMany({
    where: { id: { in: serviceIds }, professionalId },
    select: { id: true },
  });
  return owned.map((s) => s.id);
}

export async function createStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#2f4a3e");
  const serviceIds = parseServiceIds(formData);

  if (!name) return { error: "Escribe un nombre." };
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "El color no es válido." };

  const activeCount = await prisma.staff.count({
    where: { professionalId: professional.id, active: true },
  });
  if (activeCount >= MAX_ACTIVE_STAFF) {
    return {
      error: `Tu plan incluye hasta ${MAX_ACTIVE_STAFF} profesionales activos. Escríbenos a soporte@tuhoralista.com si necesitas más.`,
    };
  }

  const validServiceIds = await ownedServiceIds(professional.id, serviceIds);
  await prisma.staff.create({
    data: {
      professionalId: professional.id,
      name,
      color,
      services: { connect: validServiceIds.map((id) => ({ id })) },
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

  const validServiceIds = await ownedServiceIds(professional.id, serviceIds);
  await prisma.staff.update({
    where: { id: staffId },
    data: {
      name,
      color,
      services: { set: validServiceIds.map((id) => ({ id })) },
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

  const activeCount = await prisma.staff.count({
    where: { professionalId: professional.id, active: true },
  });

  if (staff.active && activeCount <= 1) {
    return { error: "No puedes pausar a tu único profesional activo — tu agenda quedaría sin nadie disponible." };
  }
  if (!staff.active && activeCount >= MAX_ACTIVE_STAFF) {
    return {
      error: `Tu plan incluye hasta ${MAX_ACTIVE_STAFF} profesionales activos. Pausa a otro antes de activar a este.`,
    };
  }

  await prisma.staff.update({ where: { id: staffId }, data: { active: !staff.active } });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Elimina un profesional. Si tiene citas en su historial se pausa en vez de
 * borrarse (la FK de Booking.staff no es cascade a propósito — esas reservas
 * no se deben perder). Nunca deja al negocio sin ningún profesional activo.
 */
export async function deleteStaff(staffId: string): Promise<{ error?: string; notice?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId: professional.id },
    select: { id: true, active: true, _count: { select: { bookings: true } } },
  });
  if (!staff) return { error: "No encontramos a este profesional." };

  const activeCount = await prisma.staff.count({
    where: { professionalId: professional.id, active: true },
  });
  if (staff.active && activeCount <= 1) {
    return { error: "No puedes eliminar a tu único profesional activo — tu agenda quedaría sin nadie disponible." };
  }

  if (staff._count.bookings > 0) {
    await prisma.staff.update({ where: { id: staffId }, data: { active: false } });
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    revalidatePath(`/reservar/${professional.slug}`);
    return {
      notice:
        "Este profesional tiene citas en su historial, así que se pausó en vez de eliminarse. Ya no aparece en tu página pública ni recibe reservas nuevas.",
    };
  }

  await prisma.staff.delete({ where: { id: staffId } });
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
  revalidatePath(`/reservar/${professional.slug}`);
  return {};
}
