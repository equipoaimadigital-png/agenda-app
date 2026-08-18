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
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // El teléfono siempre existe (es obligatorio al reservar); el correo es
  // opcional. Antes, un cliente sin correo nunca recibía recordatorio — ahora
  // el SMS cubre ese hueco. Se manda por cada canal disponible, no uno u otro.
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: tomorrowStart, lte: tomorrowEnd },
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
