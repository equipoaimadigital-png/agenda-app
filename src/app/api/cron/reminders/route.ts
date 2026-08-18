import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { sendReminderSms } from "@/lib/sms";

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
  let sentSms = 0;
  for (const booking of bookings) {
    const [emailOk, smsOk] = await Promise.all([
      booking.clientEmail
        ? sendReminderEmail({
            businessName: booking.professional.businessName,
            serviceName: booking.service.name,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            startTime: booking.startTime,
            manageToken: booking.manageToken,
          })
        : Promise.resolve(false),
      sendReminderSms({
        businessName: booking.professional.businessName,
        serviceName: booking.service.name,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        startTime: booking.startTime,
      }),
    ]);

    if (emailOk) sentEmail += 1;
    if (smsOk) sentSms += 1;

    if (emailOk || smsOk) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  return NextResponse.json({ processed: bookings.length, sentEmail, sentSms });
}
