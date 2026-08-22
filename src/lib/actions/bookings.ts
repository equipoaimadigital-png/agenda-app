"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { wallClockDate } from "@/lib/dates";
import { sendBookingEmails } from "@/lib/email";
import { buildWhatsappLink, sendConfirmationWhatsApp } from "@/lib/whatsapp";
import { toE164, sendConfirmationSms } from "@/lib/sms";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { resolveClientId } from "@/lib/actions/clients";
import { isValidEmail, sanitizeCustomAnswer } from "@/lib/validation";

export type StaffOptionView = { id: string; name: string; color: string };

export type ServiceFieldView = {
  id: string;
  label: string;
  type: "TEXT" | "SELECT";
  options: string[];
  required: boolean;
};

/** Preguntas personalizadas de un servicio, para pedirlas al reservar. */
export async function getServiceFields(serviceId: string): Promise<ServiceFieldView[]> {
  const fields = await prisma.serviceField.findMany({
    where: { serviceId },
    orderBy: { order: "asc" },
  });
  return fields.map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    options: f.options,
    required: f.required,
  }));
}

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
  // Rate limiting: máx 30 reservas por IP en 60 segundos
  const ip = getClientIp(await headers());
  if (!checkRateLimit(ip, 30, 60000)) {
    return { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." };
  }

  const slug = String(formData.get("slug") || "");
  const serviceId = String(formData.get("serviceId") || "");
  const staffSelection = String(formData.get("staffId") || ANY_STAFF) as StaffSelection;
  const dateStr = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim() || null;

  // Validación de longitud contra DoS: string muy largo en input
  if (clientName.length > 100) {
    return { error: "Nombre muy largo (máx 100 caracteres)." };
  }
  if (clientPhone.length > 20) {
    return { error: "Teléfono inválido (máx 20 caracteres)." };
  }
  if (clientEmail && clientEmail.length > 255) {
    return { error: "Email muy largo (máx 255 caracteres)." };
  }
  if (slug.length > 50) {
    return { error: "Slug inválido." };
  }

  // Parseo defensivo: aunque el JSON venga de nuestro propio formulario, un
  // request forjado directo al endpoint podría mandar tipos o tamaños
  // arbitrarios (array gigante, valores de varios MB). Se valida forma,
  // tipo y se recorta cada campo antes de aceptarlo.
  let customAnswers: { label: string; value: string }[] | undefined;
  const customAnswersRaw = String(formData.get("customAnswers") || "");
  if (customAnswersRaw) {
    try {
      const parsed = JSON.parse(customAnswersRaw);
      if (Array.isArray(parsed)) {
        customAnswers = parsed
          .filter(
            (item): item is { label: unknown; value: unknown } =>
              item && typeof item === "object" && "label" in item && "value" in item
          )
          .slice(0, 20) // máx 20 preguntas personalizadas por servicio
          .map((item) => ({
            label: String(item.label).slice(0, 200),
            value: sanitizeCustomAnswer(String(item.value)),
          }));
      }
    } catch {
      // ignora JSON inválido — nunca debería pasar desde nuestro propio formulario
    }
  }

  if (!slug || !serviceId || !dateStr || !time || !clientName || !clientPhone) {
    return { error: "Completa todos los campos obligatorios." };
  }
  if (clientEmail && !isValidEmail(clientEmail)) {
    return { error: "El email ingresado no es válido." };
  }

  // Validación de teléfono: debe normalizarse a E.164 sin errores
  const normalizedPhone = toE164(clientPhone);
  const phoneDigitsOnly = normalizedPhone.replace(/\D/g, "");
  if (phoneDigitsOnly.length < 9 || phoneDigitsOnly.length > 15) {
    return { error: "Teléfono debe tener entre 9 y 15 dígitos." };
  }

  const ctx = await loadBookingContext(slug, serviceId);
  if (!ctx || ctx.staffOptions.length === 0) {
    return { error: "Negocio o servicio no encontrado." };
  }

  // Protección anti-spam: si este negocio recibió muchas reservas en pocos
  // minutos (bot inundando el formulario público), se frena temporalmente
  // para no vaciar la cuota de emails ni llenar la agenda de basura.
  const recentWindow = new Date(Date.now() - 5 * 60 * 1000);
  const recentCount = await prisma.booking.count({
    where: { professionalId: ctx.professional.id, createdAt: { gte: recentWindow } },
  });
  if (recentCount >= 15) {
    return { error: "Estamos recibiendo muchas solicitudes en este momento. Intenta de nuevo en unos minutos." };
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

  const clientId = await resolveClientId(ctx.professional.id, clientPhone, clientName, clientEmail);

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
          clientId,
          customAnswers,
          startTime,
          endTime,
        },
      });
    });

    if (!booking) continue;

    // Envía confirmación por email, WhatsApp y SMS en paralelo
    await Promise.all([
      sendBookingEmails({
        businessName: ctx.professional.businessName,
        serviceName: ctx.service.name,
        clientName,
        clientEmail,
        clientPhone,
        startTime,
        professionalEmail: ctx.professional.email,
        manageToken: booking.manageToken,
      }),
      sendConfirmationWhatsApp({
        businessName: ctx.professional.businessName,
        serviceName: ctx.service.name,
        clientName,
        clientPhone,
        startTime,
        manageToken: booking.manageToken,
      }),
      sendConfirmationSms({
        businessName: ctx.professional.businessName,
        serviceName: ctx.service.name,
        clientName,
        clientPhone,
        startTime,
        manageToken: booking.manageToken,
      }),
    ]);

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

/** Servicios y profesionales del negocio, para armar el formulario de reserva manual. */
export async function getManualBookingOptions(): Promise<{
  services: { id: string; name: string; durationMin: number }[];
  staff: { id: string; name: string }[];
}> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: { professionalId: professional.id, active: true },
      select: { id: true, name: true, durationMin: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { professionalId: professional.id, active: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { services, staff };
}

/**
 * Reserva creada por el profesional desde el panel (ej. cliente que llamó por
 * teléfono). A diferencia de la reserva pública, no respeta el horario de
 * disponibilidad configurado — el profesional puede anotar una cita fuera de
 * su horario habitual si así lo decide — pero sí respeta el bloqueo contra
 * doble reserva, igual que cualquier otra cita.
 */
export async function createManualBooking(formData: FormData): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const serviceId = String(formData.get("serviceId") || "");
  const staffId = String(formData.get("staffId") || "");
  const dateStr = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const clientName = String(formData.get("clientName") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim() || null;

  if (!serviceId || !staffId || !dateStr || !time || !clientName || !clientPhone) {
    return { error: "Completa todos los campos obligatorios." };
  }
  if (clientEmail && !isValidEmail(clientEmail)) {
    return { error: "El email ingresado no es válido." };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, professionalId: professional.id },
  });
  if (!service) return { error: "Servicio no encontrado." };

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId: professional.id },
  });
  if (!staff) return { error: "Profesional no encontrado." };

  const startTime = wallClockDate(dateStr, time);
  const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

  const clientId = await resolveClientId(professional.id, clientPhone, clientName, clientEmail);

  const booking = await withStaffLock(staffId, async (tx) => {
    if (await hasOverlappingBooking(tx, staffId, startTime, endTime)) return null;
    return tx.booking.create({
      data: {
        professionalId: professional.id,
        staffId,
        serviceId,
        clientName,
        clientPhone,
        clientEmail,
        clientId,
        startTime,
        endTime,
        source: "MANUAL",
      },
    });
  });

  if (!booking) {
    return { error: "Ese horario ya está ocupado por otra cita de este profesional." };
  }

  // Envía confirmación por email, WhatsApp y SMS en paralelo
  await Promise.all([
    sendBookingEmails({
      businessName: professional.businessName,
      serviceName: service.name,
      clientName,
      clientEmail,
      clientPhone,
      startTime,
      professionalEmail: professional.email,
      manageToken: booking.manageToken,
    }),
    sendConfirmationWhatsApp({
      businessName: professional.businessName,
      serviceName: service.name,
      clientName,
      clientPhone,
      startTime,
      manageToken: booking.manageToken,
    }),
    sendConfirmationSms({
      businessName: professional.businessName,
      serviceName: service.name,
      clientName,
      clientPhone,
      startTime,
      manageToken: booking.manageToken,
    }),
  ]);

  revalidatePath("/dashboard");
  return {};
}

