"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HeadingFont, HeadingSize } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentProfessional, getPrimaryStaffId, verifyStaffOwnership } from "@/lib/auth-helpers";
import { sendCancellationEmails, sendRescheduleEmails } from "@/lib/email";
import { nowInTimeZone, wallClockDate } from "@/lib/dates";
import { hasOverlappingBooking, withStaffLock } from "@/lib/booking-logic";
import { notifyClientPhoneConfirmation } from "@/lib/notify";
import { contrastRatio } from "@/lib/color-contrast";

const HEADING_FONTS: HeadingFont[] = ["FRAUNCES", "PLAYFAIR", "POPPINS", "WORK_SANS"];
const HEADING_SIZES: HeadingSize[] = ["SMALL", "MEDIUM", "LARGE"];

/** Solo acepta http(s) — evita guardar un "javascript:" u otro esquema como link social. */
function parseHttpUrl(raw: FormDataEntryValue | null): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

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

/**
 * Mueve una cita CONFIRMED a otra fecha/hora, con el MISMO profesional que
 * la atendía. Lo hace el dueño desde el panel: no aplica la política de
 * cancelación (puede mover cuando quiera) y puede caer fuera del horario
 * publicado si así lo decide. Lo único que se bloquea es chocar con otra
 * cita del mismo profesional. Al cliente le llega el cambio por correo y,
 * si se puede, por WhatsApp/SMS.
 */
export async function rescheduleBooking(
  bookingId: string,
  dateStr: string,
  time: string
): Promise<{ error?: string }> {
  const professional = await requireProfessional();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Fecha u hora inválida." };
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, professionalId: professional.id, status: "CONFIRMED" },
    include: { service: true },
  });
  if (!booking) return { error: "Reserva no encontrada." };

  const oldStartTime = booking.startTime;
  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + booking.service.durationMin * 60000);

  if (startTime.getTime() === oldStartTime.getTime()) {
    return { error: "Elige una fecha u hora distinta." };
  }

  // Mismo bloqueo que al crear/reprogramar: dos escrituras al mismo horario
  // a la vez podrían pasar ambas la validación de solapamiento.
  const updated = await withStaffLock(booking.staffId, async (tx) => {
    if (await hasOverlappingBooking(tx, booking.staffId, startTime, endTime, booking.id)) {
      return null;
    }
    return tx.booking.update({
      where: { id: booking.id },
      data: { startTime, endTime, reminderSentAt: null },
    });
  });
  if (!updated) {
    return { error: "Ese horario choca con otra cita de este profesional." };
  }

  await Promise.all([
    sendRescheduleEmails({
      businessName: professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      professionalEmail: professional.email,
      oldStartTime,
      newStartTime: startTime,
      manageToken: booking.manageToken,
    }),
    notifyClientPhoneConfirmation({
      professionalId: professional.id,
      businessName: professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      startTime,
      manageToken: booking.manageToken,
    }),
  ]);

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
  const staffId = String(formData.get("staffId") || "");
  if (!staffId || !(await verifyStaffOwnership(staffId, professional.id))) return;

  const date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  // No tiene sentido bloquear un día que ya pasó — compara contra "hoy" en
  // la zona horaria del negocio, no la del servidor (UTC).
  const { dateStr: todayStr } = nowInTimeZone(professional.timezone);
  if (date < todayStr) return;

  await prisma.dateException.upsert({
    where: { staffId_date: { staffId, date } },
    create: { staffId, date, reason },
    update: { reason },
  });
  revalidatePath("/dashboard/disponibilidad");
}

export async function deleteDateException(staffId: string, id: string): Promise<void> {
  const professional = await requireProfessional();
  if (!(await verifyStaffOwnership(staffId, professional.id))) return;

  await prisma.dateException.deleteMany({
    where: { id, staffId },
  });
  revalidatePath("/dashboard/disponibilidad");
}

export async function updateBusinessSettings(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const professional = await requireProfessional();

  const businessName = String(formData.get("businessName") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const brandColor = String(formData.get("brandColor") || "#0f766e");
  const cancellationHours = Number(formData.get("cancellationHours") || 24);
  const headingFontRaw = String(formData.get("headingFont") || "FRAUNCES") as HeadingFont;
  const headingSizeRaw = String(formData.get("headingSize") || "MEDIUM") as HeadingSize;
  const headingFont = HEADING_FONTS.includes(headingFontRaw) ? headingFontRaw : "FRAUNCES";
  const headingSize = HEADING_SIZES.includes(headingSizeRaw) ? headingSizeRaw : "MEDIUM";
  const websiteUrl = parseHttpUrl(formData.get("websiteUrl"));
  const instagramUrl = parseHttpUrl(formData.get("instagramUrl"));
  const facebookUrl = parseHttpUrl(formData.get("facebookUrl"));

  if (!businessName) return { error: "El nombre del negocio no puede estar vacío." };
  if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
    return { error: "El color de marca no es válido." };
  }
  if (contrastRatio(brandColor, "#ffffff") < 4.5) {
    return {
      error:
        "Ese color es muy claro — el texto blanco de tus botones no se leería bien. Elige un tono más oscuro/saturado.",
    };
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      businessName,
      description,
      address,
      phone,
      brandColor,
      cancellationHours: Math.min(Math.max(cancellationHours, 0), 168),
      headingFont,
      headingSize,
      websiteUrl,
      instagramUrl,
      facebookUrl,
    },
  });
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/reservar/${professional.slug}`);
  return { success: true };
}

export async function dismissOnboarding(): Promise<void> {
  const professional = await requireProfessional();
  await prisma.professional.update({
    where: { id: professional.id },
    data: { onboardingDismissed: true },
  });
  revalidatePath("/dashboard");
}

/** Nota interna vía formulario simple. */
export async function saveInternalNoteForm(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") || "");
  const note = String(formData.get("note") || "");
  if (!bookingId) return;
  await saveInternalNote(bookingId, note);
}
