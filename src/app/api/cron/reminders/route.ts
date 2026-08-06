import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

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

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      clientEmail: { not: null },
      startTime: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: { service: true, professional: true },
  });

  let sent = 0;
  for (const booking of bookings) {
    const ok = await sendReminderEmail({
      businessName: booking.professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail!,
      startTime: booking.startTime,
    });
    if (ok) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    }
  }

  return NextResponse.json({ processed: bookings.length, sent });
}
