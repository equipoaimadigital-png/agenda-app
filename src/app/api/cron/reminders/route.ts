import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { sendReminderSms } from "@/lib/sms";
import { sendReminderWhatsApp } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const now = new Date();
  // Busca citas que empiezan entre 12 y 24 horas desde ahora
  // Eso significa: si el cron corre a las 9am, busca citas de 9pm hoy a 9pm mañana
  // El recordatorio llega ~12 horas antes de la cita
  const reminderWindowStart = new Date(now);
  reminderWindowStart.setHours(now.getHours() + 12);
  const reminderWindowEnd = new Date(now);
  reminderWindowEnd.setHours(now.getHours() + 24);

  // El teléfono siempre existe (es obligatorio al reservar); el correo es
  // opcional. Se manda recordatorio 12-24 horas antes de la cita.
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: reminderWindowStart, lte: reminderWindowEnd },
    },
    include: { service: true, professional: true },
  });

  let sentEmail = 0;
  let sentWhatsApp = 0;
  let sentSms = 0;

  for (const booking of bookings) {
    const reminderInfo = {
      businessName: booking.professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      startTime: booking.startTime,
    };

    const [emailOk, whatsAppOk, smsOk] = await Promise.all([
      booking.clientEmail
        ? sendReminderEmail({
            ...reminderInfo,
            clientEmail: booking.clientEmail,
            manageToken: booking.manageToken,
          })
        : Promise.resolve(false),
      // Intenta WhatsApp si está disponible (requiere TEMPLATE_SID aprobado por Meta)
      sendReminderWhatsApp(reminderInfo),
      // SMS siempre intenta (fallback si WhatsApp no está disponible)
      sendReminderSms(reminderInfo),
    ]);

    if (emailOk) sentEmail += 1;
    if (whatsAppOk) sentWhatsApp += 1;
    if (smsOk) sentSms += 1;

    // Marca como enviado si al menos uno de los canales fue exitoso
    if (emailOk || whatsAppOk || smsOk) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  return NextResponse.json({
    processed: bookings.length,
    sentEmail,
    sentWhatsApp,
    sentSms,
  });
}
