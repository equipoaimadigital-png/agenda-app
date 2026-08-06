import { Resend } from "resend";

const FROM = "Agenda <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type BookingEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  startTime: Date;
  professionalEmail: string;
};

export async function sendBookingEmails(info: BookingEmailInfo): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("RESEND_API_KEY no configurada; se omite el envío de emails.");
    return;
  }

  const when = formatDateTime(info.startTime);

  const tasks: Promise<unknown>[] = [];

  if (info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Confirmación de tu cita con ${info.businessName}`,
        html: `<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> quedó confirmada para el <strong>${when}</strong>.</p>
<p>¡Te esperamos!</p>`,
      })
    );
  }

  tasks.push(
    client.emails.send({
      from: FROM,
      to: info.professionalEmail,
      subject: `Nueva reserva: ${info.clientName} - ${info.serviceName}`,
      html: `<p>Tienes una nueva reserva.</p>
<ul>
  <li>Cliente: ${info.clientName}</li>
  <li>Teléfono: ${info.clientPhone}</li>
  <li>Servicio: ${info.serviceName}</li>
  <li>Fecha: ${when}</li>
</ul>`,
    })
  );

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("Error enviando email:", r.reason);
    } else if (r.value && typeof r.value === "object" && "error" in r.value && r.value.error) {
      console.error("Resend devolvió un error:", r.value.error);
    }
  }
}

type ReminderEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  startTime: Date;
};

export async function sendReminderEmail(info: ReminderEmailInfo): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const when = formatDateTime(info.startTime);

  const result = await client.emails.send({
    from: FROM,
    to: info.clientEmail,
    subject: `Recordatorio: tu cita mañana con ${info.businessName}`,
    html: `<p>Hola ${info.clientName},</p>
<p>Te recordamos tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> el <strong>${when}</strong>.</p>`,
  });

  return !result.error;
}
