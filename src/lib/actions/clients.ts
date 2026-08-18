"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";

/**
 * Encuentra o crea la ficha de cliente para esta reserva y devuelve su id,
 * para que Booking.clientId quede enlazado desde el momento en que se crea.
 * Si la ficha ya existe, solo rellena nombre/email si estaban vacíos —
 * nunca pisa una corrección manual que el negocio haya hecho en el CRM.
 */
export async function resolveClientId(
  professionalId: string,
  phone: string,
  name: string,
  email: string | null
): Promise<string> {
  const existing = await prisma.client.findUnique({
    where: { professionalId_phone: { professionalId, phone } },
  });

  if (!existing) {
    const created = await prisma.client.create({
      data: { professionalId, phone, name, email },
    });
    return created.id;
  }

  if (!existing.name || (!existing.email && email)) {
    await prisma.client.update({
      where: { id: existing.id },
      data: { name: existing.name ?? name, email: existing.email ?? email },
    });
  }

  return existing.id;
}

type UpdateClientState = { error?: string; success?: boolean };

/** Edita la ficha de un cliente — nombre, teléfono, correo, cumpleaños. */
export async function updateClient(
  clientId: string,
  _prev: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const client = await prisma.client.findFirst({
    where: { id: clientId, professionalId: professional.id },
  });
  if (!client) return { error: "No encontramos a este cliente." };

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const month = Number(formData.get("month") || 0);
  const day = Number(formData.get("day") || 0);
  const birthday =
    month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;

  if (!name) return { error: "El nombre no puede estar vacío." };
  if (!phone) return { error: "El teléfono no puede estar vacío." };

  if (phone !== client.phone) {
    const collision = await prisma.client.findUnique({
      where: { professionalId_phone: { professionalId: professional.id, phone } },
    });
    if (collision) return { error: "Ya existe otro cliente con ese teléfono." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { name, phone, email, birthday },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
