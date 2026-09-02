import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hoursUntilInTimeZone } from "@/lib/dates";
import { sendReminderEmail } from "@/lib/email";
import { notifyClientPhoneReminder } from "@/lib/notify";

// Recordatorio para toda cita CONFIRMED que arranca dentro de esta ventana
// (horas reales que faltan, calculadas en la zona horaria del negocio).
const REMIND_FROM_HOURS = 2;
const REMIND_UNTIL_HOURS = 26;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const now = new Date();
  // Los `startTime` se guardan como "hora de pared" del negocio (fake-UTC),
  // no como instante real, así que NO se puede filtrar la ventana con un
  // rango de Date real — el offset de la zona horaria (y el cambio de
  // horario de verano) descuadraban la ventana y dejaban citas sin aviso.
  //
  // 1) Pre-filtro amplio en instantes reales (±~6/30 h cubre cualquier
  //    offset de zona), solo para no traer toda la tabla.
  // 2) Filtro fino con `hoursUntilInTimeZone`, que compara en la zona del
  //    negocio y es inmune al DST.
  const preStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const preEnd = new Date(now.getTime() + 30 * 60 * 60 * 1000);

  const candidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: preStart, lte: preEnd },
    },
    include: { service: true, professional: true },
  });

  const bookings = candidates.filter((b) => {
    const h = hoursUntilInTimeZone(b.startTime, b.professional.timezone);
    return h >= REMIND_FROM_HOURS && h <= REMIND_UNTIL_HOURS;
  });

  console.log(
    `[cron/reminders] ${now.toISOString()} — ${candidates.length} candidata(s), ${bookings.length} dentro de la ventana [${REMIND_FROM_HOURS}h, ${REMIND_UNTIL_HOURS}h]`
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
