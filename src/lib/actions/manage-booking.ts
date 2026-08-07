"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { daySlots, loadBookingContext } from "@/lib/booking-logic";
import { wallClockDate } from "@/lib/dates";
import { sendCancellationEmails, sendRescheduleEmails } from "@/lib/email";

/** ¿La cita todavía se puede modificar según la política del negocio? */
function withinPolicy(startTime: Date, cancellationHours: number): boolean {
  const limit = new Date(startTime.getTime() - cancellationHours * 3600_000);
  return new Date() < limit;
}

async function loadByToken(token: string) {
  return prisma.booking.findUnique({
    where: { manageToken: token },
    include: { professional: true, service: true },
  });
}

export async function cancelBookingByToken(token: string): Promise<{ error?: string }> {
  const booking = await loadByToken(token);
  if (!booking || booking.status !== "CONFIRMED") {
    return { error: "Esta reserva no se puede cancelar." };
  }
  if (!withinPolicy(booking.startTime, booking.professional.cancellationHours)) {
    return {
      error: `El plazo para cancelar en línea ya pasó (hasta ${booking.professional.cancellationHours} h antes). Contacta directamente al negocio.`,
    };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelReason: "Cancelada por el cliente" },
  });

  await sendCancellationEmails({
    businessName: booking.professional.businessName,
    serviceName: booking.service.name,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    professionalEmail: booking.professional.email,
    startTime: booking.startTime,
    cancelledBy: "client",
    slug: booking.professional.slug,
  });

  revalidatePath(`/reserva/${token}`);
  revalidatePath("/dashboard");
  return {};
}

export async function rescheduleBookingByToken(
  token: string,
  dateStr: string,
  time: string
): Promise<{ error?: string }> {
  const booking = await loadByToken(token);
  if (!booking || booking.status !== "CONFIRMED") {
    return { error: "Esta reserva no se puede reprogramar." };
  }
  if (!withinPolicy(booking.startTime, booking.professional.cancellationHours)) {
    return {
      error: `El plazo para reprogramar en línea ya pasó (hasta ${booking.professional.cancellationHours} h antes). Contacta directamente al negocio.`,
    };
  }

  const ctx = await loadBookingContext(booking.professional.slug, booking.serviceId);
  if (!ctx) return { error: "El servicio ya no está disponible." };

  const available = await daySlots(ctx, dateStr);
  if (!available.includes(time)) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  const oldStartTime = booking.startTime;
  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + booking.service.durationMin * 60000);

  await prisma.booking.update({
    where: { id: booking.id },
    data: { startTime, endTime, reminderSentAt: null },
  });

  await sendRescheduleEmails({
    businessName: booking.professional.businessName,
    serviceName: booking.service.name,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    professionalEmail: booking.professional.email,
    oldStartTime,
    newStartTime: startTime,
    manageToken: token,
  });

  revalidatePath(`/reserva/${token}`);
  revalidatePath("/dashboard");
  return {};
}
