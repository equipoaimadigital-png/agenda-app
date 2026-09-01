import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { notifyClientPhoneReminder } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const now = new Date();
  // Recordatorio para toda cita CONFIRMED de las próximas ~26 horas que aún
  // no lo recibió (`reminderSentAt: null` deduplica entre corridas). Antes
  // la ventana era [+12h, +24h]: con el plan Hobby de Vercel los crons solo
  // corren 1 vez al día con precisión de ±1h, así que una ventana angosta
  // dejaba la mitad de las citas sin aviso. Con esta ventana amplia, basta
  // que el cron corra una vez al día para que ninguna cita se quede sin
  // recordatorio; lo pagado en precisión (puede llegar hasta ~26h antes en
  // vez de exactamente 12h) se recupera si el cron corre varias veces.
  // El límite inferior de +2h evita "recordar" algo que ya es casi ahora.
  const windowStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: windowStart, lte: windowEnd },
    },
    include: { service: true, professional: true },
  });

  console.log(
    `[cron/reminders] ${now.toISOString()} — ventana ${windowStart.toISOString()}..${windowEnd.toISOString()} — ${bookings.length} cita(s) por recordar`
  );

  let sentEmail = 0;
  let sentWhatsApp = 0;
  let sentSms = 0;
  const failures: string[] = [];

  for (const booking of bookings) {
    const reminderInfo = {
      professionalId: booking.professional.id,
      businessName: booking.professional.businessName,
      serviceName: booking.service.name,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      startTime: booking.startTime,
    };

    const [emailOk, phoneChannel] = await Promise.all([
      booking.clientEmail
        ? sendReminderEmail({
            ...reminderInfo,
            clientEmail: booking.clientEmail,
            manageToken: booking.manageToken,
          })
        : Promise.resolve(false),
      // WhatsApp primero; SMS solo si WhatsApp no salió.
      notifyClientPhoneReminder(reminderInfo),
    ]);

    if (emailOk) sentEmail += 1;
    if (phoneChannel === "whatsapp") sentWhatsApp += 1;
    else if (phoneChannel === "sms") sentSms += 1;

    // Marca como enviado si al menos uno de los canales fue exitoso. Si
    // fallaron todos, no se marca: se reintenta en la próxima corrida.
    if (emailOk || phoneChannel !== "none") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
    } else {
      failures.push(booking.id);
    }
  }

  const summary = {
    processed: bookings.length,
    sentEmail,
    sentWhatsApp,
    sentSms,
    failedAllChannels: failures.length,
  };
  console.log(`[cron/reminders] resultado: ${JSON.stringify(summary)}`);
  if (failures.length > 0) {
    console.warn(`[cron/reminders] citas sin ningún canal exitoso: ${failures.join(", ")}`);
  }

  return NextResponse.json(summary);
}
