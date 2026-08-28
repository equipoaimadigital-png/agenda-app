"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DepositMode, FieldType, ServicePriceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

/**
 * Un depósito solo tiene sentido si el profesional ya conectó su cuenta de
 * Mercado Pago — sin eso no hay a dónde mandar el cobro. Si no está
 * conectado, se ignora silenciosamente cualquier monto que hayan puesto
 * (el campo en la UI también aparece deshabilitado en ese caso).
 */
function parseDepositAmount(raw: FormDataEntryValue | null, mpConnectedUserId: string | null): number | null {
  if (!mpConnectedUserId) return null;
  const value = Number(String(raw || "").trim());
  if (!value || value <= 0) return null;
  return Math.round(value);
}

/**
 * El modo solo puede quedar en OPTIONAL/REQUIRED si hay cuenta de Mercado
 * Pago conectada y un monto válido — si falta cualquiera de los dos, se
 * fuerza a NONE para no dejar servicios "pidiendo depósito" que no se
 * pueden cobrar.
 */
function parseDepositMode(
  raw: FormDataEntryValue | null,
  mpConnectedUserId: string | null,
  amount: number | null
): DepositMode {
  if (!mpConnectedUserId || !amount) return DepositMode.NONE;
  const value = String(raw || "");
  return value === "OPTIONAL" || value === "REQUIRED" ? (value as DepositMode) : DepositMode.NONE;
}

export async function createService(formData: FormData) {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const durationMin = Number(formData.get("durationMin") || 0);
  const priceTypeRaw = String(formData.get("priceType") || "FIXED");
  const priceType: ServicePriceType =
    priceTypeRaw === "FROM" || priceTypeRaw === "QUOTE" ? priceTypeRaw : "FIXED";
  const priceRaw = String(formData.get("price") || "").trim();
  // "A cotizar" no lleva precio público — cualquier valor ingresado se ignora.
  const price = priceType !== "QUOTE" && priceRaw ? Number(priceRaw) : null;
  const depositAmount = parseDepositAmount(formData.get("depositAmount"), professional.mpConnectedUserId);
  const depositMode = parseDepositMode(
    formData.get("depositMode"),
    professional.mpConnectedUserId,
    depositAmount
  );

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
      priceType,
      depositAmount,
      depositMode,
      staff: { connect: activeStaff.map((s) => ({ id: s.id })) },
    },
  });

  revalidatePath("/dashboard/servicios");
}

/** Cambia el modo y el monto del depósito de un servicio ya existente. */
export async function updateServiceDeposit(serviceId: string, formData: FormData): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id },
  });
  if (!service) return;

  const depositAmount = parseDepositAmount(formData.get("depositAmount"), professional.mpConnectedUserId);
  const depositMode = parseDepositMode(
    formData.get("depositMode"),
    professional.mpConnectedUserId,
    depositAmount
  );

  await prisma.service.update({
    where: { id: serviceId },
    data: { depositAmount, depositMode },
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
  const bookingsCount = await prisma.booking.count({
    where: { serviceId, professionalId: professional.id },
  });
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
