"use server";

import { prisma } from "@/lib/db";
import { computeAvailableSlots } from "@/lib/slots";
import { revalidatePath } from "next/cache";

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function dayBounds(dateStr: string) {
  const { year, month, day } = parseDate(dateStr);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
}

export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  dateStr: string
): Promise<string[]> {
  const professional = await prisma.professional.findUnique({ where: { slug } });
  if (!professional) return [];

  const professionalId = professional.id;
  const [service, blocks] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, professionalId, active: true } }),
    prisma.availability.findMany({ where: { professionalId } }),
  ]);

  if (!service) return [];

  const { year, month, day } = parseDate(dateStr);
  const weekday = new Date(year, month - 1, day).getDay();
  const dayBlocks = blocks.filter((b) => b.weekday === weekday);
  if (dayBlocks.length === 0) return [];

  const { start, end } = dayBounds(dateStr);
  const existing = await prisma.booking.findMany({
    where: {
      professionalId,
      status: "CONFIRMED",
      startTime: { gte: start, lte: end },
    },
    select: { startTime: true, endTime: true },
  });

  const busy = existing.map((b) => ({
    startMinutes: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
    endMinutes: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
  }));

  const now = new Date();
  const isToday =
    now.getFullYear() === year && now.getMonth() === month - 1 && now.getDate() === day;
  const minMinutesFromNow = isToday ? now.getHours() * 60 + now.getMinutes() : null;

  const slots = computeAvailableSlots(
    dayBlocks.map((b) => ({ startMinutes: b.startMinutes, endMinutes: b.endMinutes })),
    service.durationMin,
    busy,
    minMinutesFromNow
  );

  return slots.map((m) => {
    const h = Math.floor(m / 60)
      .toString()
      .padStart(2, "0");
    const min = (m % 60).toString().padStart(2, "0");
    return `${h}:${min}`;
  });
}

export async function createPublicBooking(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const slug = String(formData.get("slug") || "");
  const serviceId = String(formData.get("serviceId") || "");
  const dateStr = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim() || null;

  if (!slug || !serviceId || !dateStr || !time || !clientName || !clientPhone) {
    return { error: "Completa todos los campos." };
  }

  const professional = await prisma.professional.findUnique({ where: { slug } });
  if (!professional) return { error: "Negocio no encontrado." };

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id, active: true },
  });
  if (!service) return { error: "Servicio no válido." };

  const { year, month, day } = parseDate(dateStr);
  const [hour, minute] = time.split(":").map(Number);
  const startTime = new Date(year, month - 1, day, hour, minute, 0, 0);
  const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

  // Vuelve a validar el horario justo antes de crear la reserva, por si alguien más lo tomó primero
  const overlapping = await prisma.booking.findFirst({
    where: {
      professionalId: professional.id,
      status: "CONFIRMED",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (overlapping) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  await prisma.booking.create({
    data: {
      professionalId: professional.id,
      serviceId: service.id,
      clientName,
      clientPhone,
      clientEmail,
      startTime,
      endTime,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
