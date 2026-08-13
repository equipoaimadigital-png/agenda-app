"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional, getPrimaryStaffId } from "@/lib/auth-helpers";
import { sendCancellationEmails } from "@/lib/email";
import { wallClockDate } from "@/lib/dates";

async function requireProfessional() {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");
  return professional;
}

export async function markBookingStatus(
  bookingId: string,
  status: "COMPLETED" | "NO_SHOW"
): Promise<void> {
  const professional = await requireProfessional();
  await prisma.booking.updateMany({
    where: { id: bookingId, professionalId: professional.id, status: "CONFIRMED" },
    data: { status },
  });
  revalidatePath("/dashboard");
}

export async function saveInternalNote(bookingId: string, note: string): Promise<void> {
  const professional = await requireProfessional();
  await prisma.booking.updateMany({
    where: { id: bookingId, professionalId: professional.id },
    data: { internalNote: note.trim() || null },
  });
  revalidatePath("/dashboard");
}

export async function cancelBookingByProfessional(
  bookingId: string,
  reason: string
): Promise<{ error?: string }> {
  const professional = await requireProfessional();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, professionalId: professional.id, status: "CONFIRMED" },
    include: { service: true },
  });
  if (!booking) return { error: "Reserva no encontrada." };

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelReason: reason.trim() || "Cancelada por el negocio" },
  });

  await sendCancellationEmails({
    businessName: professional.businessName,
    serviceName: booking.service.name,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    professionalEmail: professional.email,
    startTime: booking.startTime,
    cancelledBy: "professional",
    reason: reason.trim() || null,
    slug: professional.slug,
  });

  revalidatePath("/dashboard");
  return {};
}

/** Revierte una cancelación hecha por error, si el horario sigue libre. */
export async function undoCancelBooking(bookingId: string): Promise<{ error?: string }> {
  const professional = await requireProfessional();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, professionalId: professional.id, status: "CANCELLED" },
  });
  if (!booking) return { error: "Esta reserva ya no se puede restaurar." };

  const overlapping = await prisma.booking.findFirst({
    where: {
      professionalId: professional.id,
      status: "CONFIRMED",
      id: { not: booking.id },
      startTime: { lt: booking.endTime },
      endTime: { gt: booking.startTime },
    },
  });
  if (overlapping) {
    return { error: "Ese horario ya fue tomado por otra reserva, no se puede restaurar." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", cancelReason: null },
  });

  revalidatePath("/dashboard");
  return {};
}

/** Emergencia: cancela todas las citas confirmadas de un día y bloquea el día. */
export async function cancelDayEmergency(
  dateStr: string,
  reason: string
): Promise<{ cancelled: number }> {
  const professional = await requireProfessional();
  const dayStart = wallClockDate(dateStr, "00:00");
  const dayEnd = wallClockDate(dateStr, "23:59");

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId: professional.id,
      status: "CONFIRMED",
      startTime: { gte: dayStart, lte: dayEnd },
    },
    include: { service: true },
  });

  const finalReason = reason.trim() || "Imprevisto del negocio";

  for (const booking of bookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelReason: finalReason },
    });
    await sendCancellationEmails({
      businessName: professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      professionalEmail: professional.email,
      startTime: booking.startTime,
      cancelledBy: "professional",
      reason: finalReason,
      slug: professional.slug,
    });
  }

  const staffId = await getPrimaryStaffId(professional.id);
  if (staffId) {
    await prisma.dateException.upsert({
      where: { staffId_date: { staffId, date: dateStr } },
      create: { staffId, date: dateStr, reason: finalReason },
      update: { reason: finalReason },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/disponibilidad");
  return { cancelled: bookings.length };
}

export async function addDateException(formData: FormData): Promise<void> {
  const professional = await requireProfessional();
  const staffId = await getPrimaryStaffId(professional.id);
  if (!staffId) return;

  const date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  await prisma.dateException.upsert({
    where: { staffId_date: { staffId, date } },
    create: { staffId, date, reason },
    update: { reason },
  });
  revalidatePath("/dashboard/disponibilidad");
}

export async function deleteDateException(id: string): Promise<void> {
  const professional = await requireProfessional();
  const staffId = await getPrimaryStaffId(professional.id);
  if (!staffId) return;

  await prisma.dateException.deleteMany({
    where: { id, staffId },
  });
  revalidatePath("/dashboard/disponibilidad");
}

export async function updateBusinessSettings(formData: FormData): Promise<void> {
  const professional = await requireProfessional();

  const businessName = String(formData.get("businessName") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const brandColor = String(formData.get("brandColor") || "#0f766e");
  const cancellationHours = Number(formData.get("cancellationHours") || 24);

  if (!businessName) return;
  if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) return;

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      businessName,
      description,
      address,
      phone,
      brandColor,
      cancellationHours: Math.min(Math.max(cancellationHours, 0), 168),
    },
  });
  revalidatePath("/dashboard", "layout");
}

/** Nota interna vía formulario simple. */
export async function saveInternalNoteForm(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  const note = String(formData.get("note") || "");
  if (!bookingId) return;
  await saveInternalNote(bookingId, note);
}
