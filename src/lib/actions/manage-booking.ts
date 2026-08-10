"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  daySlots,
  hasOverlappingBooking,
  loadBookingContext,
  withStaffLock,
} from "@/lib/booking-logic";
import { minutesToTime, nowInTimeZone, wallClockDate } from "@/lib/dates";
import { sendCancellationEmails, sendRescheduleEmails } from "@/lib/email";

/**
 * ¿La cita todavía se puede modificar según la política del negocio?
 *
 * `startTime` está guardado como "hora de pared" del negocio (ver dates.ts), no
 * como instante real, así que comparar contra `new Date()` desplazaría el plazo
 * por el offset de la zona horaria: con el servidor en UTC, una cita de las
 * 09:00 en Santiago daba un plazo efectivo de 27 h en vez de 24 h. Se compara
 * contra "ahora" convertido a la misma convención de hora de pared.
 */
function withinPolicy(startTime: Date, cancellationHours: number, timezone: string): boolean {
  const now = nowInTimeZone(timezone);
  const nowWallClock = wallClockDate(now.dateStr, minutesToTime(now.minutes));
  const limit = new Date(startTime.getTime() - cancellationHours * 3600_000);
  return nowWallClock < limit;
}

async function loadByToken(token: string) {
  return prisma.booking.findUnique({
    where: { manageToken: token },
    include: { professional: true, service: true, staff: true },
  });
}

export async function cancelBookingByToken(token: string): Promise<{ error?: string }> {
  const booking = await loadByToken(token);
  if (!booking || booking.status !== "CONFIRMED") {
    return { error: "Esta reserva no se puede cancelar." };
  }
  if (
    !withinPolicy(
      booking.startTime,
      booking.professional.cancellationHours,
      booking.professional.timezone
    )
  ) {
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
  if (
    !withinPolicy(
      booking.startTime,
      booking.professional.cancellationHours,
      booking.professional.timezone
    )
  ) {
    return {
      error: `El plazo para reprogramar en línea ya pasó (hasta ${booking.professional.cancellationHours} h antes). Contacta directamente al negocio.`,
    };
  }

  const ctx = await loadBookingContext(booking.professional.slug, booking.serviceId);
  if (!ctx) return { error: "El servicio ya no está disponible." };

  // Reprogramar mantiene el mismo profesional (staff) que atendía la cita;
  // no se reasigna a "cualquiera disponible" a espaldas del cliente.
  const available = await daySlots(ctx, booking.staffId, dateStr);
  if (!available.includes(time)) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  const oldStartTime = booking.startTime;
  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + booking.service.durationMin * 60000);

  // Mismo bloqueo que al crear: dos clientes reprogramando al mismo horario a
  // la vez podrían pasar ambos la validación de `daySlots`.
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
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

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
