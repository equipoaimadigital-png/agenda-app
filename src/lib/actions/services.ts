"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldType } from "@prisma/client";
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

  // Un servicio solo es reservable si algún Staff lo tiene asignado. Hasta que
  // exista la UI de gestión de staff (v3 Task #14), un servicio nuevo se
  // asigna a todo el staff activo del negocio para que quede reservable de
  // inmediato, igual que antes de introducir multi-staff.
  const activeStaff = await prisma.staff.findMany({
    where: { professionalId: professional.id, active: true },
    select: { id: true },
  });

  await prisma.service.create({
    data: {
      professionalId: professional.id,
      name,
      description,
      durationMin,
      price,
      staff: { connect: activeStaff.map((s) => ({ id: s.id })) },
    },
  });

  revalidatePath("/dashboard/servicios");
}

/** Agrega una pregunta personalizada a un servicio (ej. "¿Ya iniciaste el trámite?"). */
export async function addServiceField(formData: FormData): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const serviceId = String(formData.get("serviceId") || "");
  const label = String(formData.get("label") || "").trim();
  const type = String(formData.get("type") || "TEXT");
  const required = formData.get("required") === "on";
  const optionsRaw = String(formData.get("options") || "").trim();

  if (!label || !serviceId) return;
  if (type !== "TEXT" && type !== "SELECT") return;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id },
  });
  if (!service) return;

  const options =
    type === "SELECT"
      ? optionsRaw.split(",").map((o) => o.trim()).filter(Boolean)
      : [];
  if (type === "SELECT" && options.length < 2) return;

  const lastField = await prisma.serviceField.findFirst({
    where: { serviceId },
    orderBy: { order: "desc" },
  });

  await prisma.serviceField.create({
    data: {
      serviceId,
      label,
      type: type as FieldType,
      options,
      required,
      order: (lastField?.order ?? -1) + 1,
    },
  });

  revalidatePath("/dashboard/servicios");
}

export async function deleteServiceField(fieldId: string): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  await prisma.serviceField.deleteMany({
    where: { id: fieldId, service: { professionalId: professional.id } },
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
