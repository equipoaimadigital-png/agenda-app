"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { isValidEmail } from "@/lib/validation";
import { toE164 } from "@/lib/phone";

/**
 * Encuentra o crea la ficha de cliente para esta reserva y devuelve su id,
 * para que Booking.clientId quede enlazado desde el momento en que se crea.
 * Si la ficha ya existe, solo rellena nombre/email si estaban vacíos —
 * nunca pisa una corrección manual que el negocio haya hecho en el CRM.
 */
export async function resolveClientId(
  professionalId: string,
  phoneInput: string,
  name: string,
  email: string | null
): Promise<string> {
  // Segundo cinturón: aunque los callers ya normalizan, acá también — así
  // ninguna ruta futura crea una ficha con el teléfono en crudo.
  const phone = toE164(phoneInput);

  const existing = await prisma.client.findUnique({
    where: { professionalId_phone: { professionalId, phone } },
  });

  if (!existing) {
    try {
      const created = await prisma.client.create({
        data: { professionalId, phone, name, email },
      });
      return created.id;
    } catch (err) {
      // Carrera: dos reservas del mismo teléfono llegaron casi a la vez (dos
      // pestañas, reintento de red) y ambas vieron "no existe" — la segunda
      // choca contra la restricción única. En vez de fallar, usa el registro
      // que la primera ya creó.
      const isUniqueViolation =
        err && typeof err === "object" && "code" in err && err.code === "P2002";
      if (!isUniqueViolation) throw err;
      const createdByOther = await prisma.client.findUnique({
        where: { professionalId_phone: { professionalId, phone } },
      });
      if (createdByOther) return createdByOther.id;
      throw err;
    }
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
  const phoneRaw = String(formData.get("phone") || "").trim();
  const phone = phoneRaw ? toE164(phoneRaw) : "";
  const email = String(formData.get("email") || "").trim() || null;
  const month = Number(formData.get("month") || 0);
  const day = Number(formData.get("day") || 0);
  const birthday =
    month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;

  if (!name) return { error: "El nombre no puede estar vacío." };
  if (!phone) return { error: "El teléfono no puede estar vacío." };
  if (email && !isValidEmail(email)) return { error: "El email ingresado no es válido." };

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

const REDACTED_NAME = "Cliente eliminado";

/**
 * Borra los datos personales de un cliente (derecho de eliminación, Ley
 * 21.719). No se elimina la fila del cliente ni sus reservas — se
 * anonimizan — porque `Booking.clientName/clientPhone/clientEmail` guardan
 * una copia independiente de esos datos en cada cita (a propósito, para que
 * el historial no cambie si el cliente corrige su info después). Borrar
 * solo la ficha del CRM dejaría sus datos reales esparcidos en cada reserva
 * pasada. Anonimizar preserva la reserva en sí (fecha, servicio, si asistió)
 * para que no se rompan las estadísticas del negocio, pero sin nada que
 * identifique a la persona.
 *
 * El teléfono no puede quedar vacío (columna requerida) ni repetirse entre
 * clientes del mismo negocio (restricción única) — se reemplaza por un
 * placeholder único derivado del id, no reutilizable por otro cliente.
 */
export async function anonymizeClient(clientId: string): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const client = await prisma.client.findFirst({
    where: { id: clientId, professionalId: professional.id },
  });
  if (!client) return { error: "No encontramos a este cliente." };

  const redactedPhone = `eliminado-${client.id}`;

  await prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: { name: null, phone: redactedPhone, email: null, birthday: null },
    }),
    prisma.booking.updateMany({
      where: { clientId },
      data: { clientName: REDACTED_NAME, clientPhone: redactedPhone, clientEmail: null },
    }),
  ]);

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}`);
  revalidatePath("/dashboard");
  return {};
}
