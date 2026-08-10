"use server";

import { revalidatePath } from "next/cache";
import {
  ANY_STAFF,
  daySlots,
  hasOverlappingBooking,
  loadBookingContext,
  monthAvailability,
  nextAvailableDays,
  withStaffLock,
  type DaySuggestion,
  type StaffSelection,
} from "@/lib/booking-logic";
import { wallClockDate } from "@/lib/dates";
import { sendBookingEmails } from "@/lib/email";
import { buildWhatsappLink } from "@/lib/whatsapp";

export type StaffOptionView = { id: string; name: string; color: string };

/** Profesionales que pueden realizar un servicio, para que el cliente elija. */
export async function getStaffForService(
  slug: string,
  serviceId: string
): Promise<StaffOptionView[]> {
  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return [];
  return ctx.staffOptions.map((o) => ({ id: o.staff.id, name: o.staff.name, color: o.staff.color }));
}

/** Fechas con disponibilidad de un mes, para pintar el calendario. */
export async function getMonthAvailability(
  slug: string,
  serviceId: string,
  staffSelection: StaffSelection,
  year: number,
  month: number
): Promise<string[]> {
  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return [];
  return monthAvailability(ctx, staffSelection, year, month);
}

export type SlotsResult = {
  slots: string[];
  /** Si el día no tiene horarios, próximos días con cupos */
  suggestions: DaySuggestion[];
};

export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  staffSelection: StaffSelection,
  dateStr: string
): Promise<SlotsResult> {
  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx) return { slots: [], suggestions: [] };

  const slots = await daySlots(ctx, staffSelection, dateStr);
  if (slots.length > 0) return { slots, suggestions: [] };

  const suggestions = await nextAvailableDays(ctx, staffSelection, dateStr);
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
  const staffSelection = String(formData.get("staffId") || ANY_STAFF) as StaffSelection;
  const dateStr = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim() || null;

  if (!slug || !serviceId || !dateStr || !time || !clientName || !clientPhone) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx || ctx.staffOptions.length === 0) {
    return { error: "Negocio o servicio no encontrado." };
  }

  // Candidatos a intentar: el staff puntual elegido, o todos si es "cualquiera"
  const candidates =
    staffSelection === ANY_STAFF
      ? ctx.staffOptions
      : ctx.staffOptions.filter((o) => o.staff.id === staffSelection);
  if (candidates.length === 0) {
    return { error: "Ese profesional ya no está disponible. Elige otro." };
  }

  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + ctx.service.durationMin * 60000);

  // Prueba cada candidato hasta encontrar uno libre. Cada intento queda
  // protegido por su propio bloqueo de transacción (withStaffLock), así que
  // dos clientes reservando a la vez sobre el mismo profesional nunca pueden
  // crear una doble reserva — el segundo simplemente pasa al siguiente
  // candidato o falla si no queda ninguno.
  for (const option of candidates) {
    const available = await daySlots(ctx, option.staff.id, dateStr);
    if (!available.includes(time)) continue;

    const booking = await withStaffLock(option.staff.id, async (tx) => {
      if (await hasOverlappingBooking(tx, option.staff.id, startTime, endTime)) {
        return null;
      }
      return tx.booking.create({
        data: {
          professionalId: ctx.professional.id,
          staffId: option.staff.id,
          serviceId: ctx.service.id,
          clientName,
          clientPhone,
          clientEmail,
          startTime,
          endTime,
        },
      });
    });

    if (!booking) continue;

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

  return { error: "Ese horario ya no está disponible. Elige otro." };
}

