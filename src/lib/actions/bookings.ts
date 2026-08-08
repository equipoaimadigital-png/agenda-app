"use server";

import { revalidatePath } from "next/cache";
import {
  daySlots,
  hasOverlappingBooking,
  loadBookingContext,
  monthAvailability,
  nextAvailableDays,
  withProfessionalLock,
  type DaySuggestion,
} from "@/lib/booking-logic";
import { wallClockDate } from "@/lib/dates";
import { sendBookingEmails } from "@/lib/email";
import { buildWhatsappLink } from "@/lib/whatsapp";

/** Fechas con disponibilidad de un mes, para pintar el calendario. */
export async function getMonthAvailability(
  slug: string,
  serviceId: string,
  year: number,
  month: number
): Promise<string[]> {
  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return [];
  return monthAvailability(ctx, year, month);
}

export type SlotsResult = {
  slots: string[];
  /** Si el día no tiene horarios, próximos días con cupos */
  suggestions: DaySuggestion[];
};

export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  dateStr: string
): Promise<SlotsResult> {
  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return { slots: [], suggestions: [] };

  const slots = await daySlots(ctx, dateStr);
  if (slots.length > 0) return { slots, suggestions: [] };

  const suggestions = await nextAvailableDays(ctx, dateStr);
  return { slots: [], suggestions };
}

export type CreateBookingResult = {
  error?: string;
  success?: boolean;
  manageToken?: string;
  whatsappLink?: string;
};

export async function createPublicBooking(formData: FormData): Promise<CreateBookingResult> {
  const slug = String(formData.get("slug") || "");
  const serviceId = String(formData.get("serviceId") || "");
  const dateStr = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim() || null;

  if (!slug || !serviceId || !dateStr || !time || !clientName || !clientPhone) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return { error: "Negocio o servicio no encontrado." };

  // Revalida el horario en el servidor justo antes de crear la reserva
  const available = await daySlots(ctx, dateStr);
  if (!available.includes(time)) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + ctx.service.durationMin * 60000);

  // Verificar y crear dentro del mismo bloqueo: si dos personas reservan el
  // mismo horario a la vez, la segunda ve la reserva de la primera y falla.
  const booking = await withProfessionalLock(ctx.professional.id, async (tx) => {
    if (await hasOverlappingBooking(tx, ctx.professional.id, startTime, endTime)) {
      return null;
    }
    return tx.booking.create({
      data: {
        professionalId: ctx.professional.id,
        serviceId: ctx.service.id,
        clientName,
        clientPhone,
        clientEmail,
        startTime,
        endTime,
      },
    });
  });

  if (!booking) {
    return { error: "Ese horario ya no está disponible. Elige otro." };
  }

  await sendBookingEmails({
    businessName: ctx.professional.businessName,
    serviceName: ctx.service.name,
    clientName,
    clientEmail,
    clientPhone,
    startTime,
    professionalEmail: ctx.professional.email,
    manageToken: booking.manageToken,
  });

  const whatsappMessage = `Hola ${clientName}, tu cita para ${ctx.service.name} con ${ctx.professional.businessName} quedó confirmada. Detalle: ${process.env.NEXT_PUBLIC_SITE_URL}/reserva/${booking.manageToken}`;

  revalidatePath("/dashboard");
  return {
    success: true,
    manageToken: booking.manageToken,
    whatsappLink: buildWhatsappLink(clientPhone, whatsappMessage),
  };
}
