import { Resend } from "resend";
import { formatDateLong, wallClockOf } from "@/lib/dates";

const FROM = "Agenda <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function whenText(startTime: Date): string {
  const { dateStr, time } = wallClockOf(startTime);
  return `${formatDateLong(dateStr)} a las ${time}`;
}

async function sendAll(tasks: Promise<unknown>[]): Promise<void> {
  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("Error enviando email:", r.reason);
    } else if (r.value && typeof r.value === "object" && "error" in r.value && r.value.error) {
      console.error("Resend devolvió un error:", r.value.error);
    }
  }
}

type BookingEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  startTime: Date;
  professionalEmail: string;
  manageToken: string;
};

export async function sendBookingEmails(info: BookingEmailInfo): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("RESEND_API_KEY no configurada; se omite el envío de emails.");
    return;
  }

  const when = whenText(info.startTime);
  const manageUrl = `${siteUrl()}/reserva/${info.manageToken}`;
  const tasks: Promise<unknown>[] = [];

  if (info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Confirmación de tu cita con ${info.businessName}`,
        html: `<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> quedó confirmada para el <strong>${when}</strong>.</p>
<p>Puedes ver el detalle, cancelar o reprogramar desde este link:<br/>
<a href="${manageUrl}">${manageUrl}</a></p>
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

  await sendAll(tasks);
}

type CancellationEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string | null;
  professionalEmail: string;
  startTime: Date;
  cancelledBy: "client" | "professional";
  reason?: string | null;
  /** Slug del negocio, para ofrecer reagendar */
  slug: string;
};

export async function sendCancellationEmails(info: CancellationEmailInfo): Promise<void> {
  const client = getClient();
  if (!client) return;

  const when = whenText(info.startTime);
  const rebookUrl = `${siteUrl()}/reservar/${info.slug}`;
  const tasks: Promise<unknown>[] = [];

  if (info.cancelledBy === "professional" && info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Tu cita con ${info.businessName} fue cancelada`,
        html: `<p>Hola ${info.clientName},</p>
<p>Lamentamos informarte que tu cita para <strong>${info.serviceName}</strong> del <strong>${when}</strong> fue cancelada por ${info.businessName}.</p>
${info.reason ? `<p>Motivo: ${info.reason}</p>` : ""}
<p>Puedes reagendar en el horario que más te acomode aquí:<br/>
<a href="${rebookUrl}">${rebookUrl}</a></p>`,
      })
    );
  }

  if (info.cancelledBy === "client") {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.professionalEmail,
        subject: `Cancelación: ${info.clientName} - ${info.serviceName}`,
        html: `<p>${info.clientName} canceló su cita de <strong>${info.serviceName}</strong> del <strong>${when}</strong>.</p>
<p>El horario quedó disponible de nuevo.</p>`,
      })
    );
    if (info.clientEmail) {
      tasks.push(
        client.emails.send({
          from: FROM,
          to: info.clientEmail,
          subject: `Cancelaste tu cita con ${info.businessName}`,
          html: `<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> del <strong>${when}</strong> quedó cancelada.</p>
<p>Si quieres reagendar: <a href="${rebookUrl}">${rebookUrl}</a></p>`,
        })
      );
    }
  }

  await sendAll(tasks);
}

type RescheduleEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string | null;
  professionalEmail: string;
  oldStartTime: Date;
  newStartTime: Date;
  manageToken: string;
};

export async function sendRescheduleEmails(info: RescheduleEmailInfo): Promise<void> {
  const client = getClient();
  if (!client) return;

  const oldWhen = whenText(info.oldStartTime);
  const newWhen = whenText(info.newStartTime);
  const manageUrl = `${siteUrl()}/reserva/${info.manageToken}`;
  const tasks: Promise<unknown>[] = [];

  if (info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Tu cita con ${info.businessName} fue reprogramada`,
        html: `<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> cambió del ${oldWhen} al <strong>${newWhen}</strong>.</p>
<p>Detalle de tu reserva: <a href="${manageUrl}">${manageUrl}</a></p>`,
      })
    );
  }

  tasks.push(
    client.emails.send({
      from: FROM,
      to: info.professionalEmail,
      subject: `Reprogramación: ${info.clientName} - ${info.serviceName}`,
      html: `<p>${info.clientName} reprogramó su cita de <strong>${info.serviceName}</strong>.</p>
<ul>
  <li>Antes: ${oldWhen}</li>
  <li>Ahora: <strong>${newWhen}</strong></li>
</ul>`,
    })
  );

  await sendAll(tasks);
}

type ReminderEmailInfo = {
  businessName: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  startTime: Date;
  manageToken: string;
};

export async function sendReminderEmail(info: ReminderEmailInfo): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const when = whenText(info.startTime);
  const manageUrl = `${siteUrl()}/reserva/${info.manageToken}`;

  const result = await client.emails.send({
    from: FROM,
    to: info.clientEmail,
    subject: `Recordatorio: tu cita mañana con ${info.businessName}`,
    html: `<p>Hola ${info.clientName},</p>
<p>Te recordamos tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> el <strong>${when}</strong>.</p>
<p>Si necesitas cancelar o reprogramar: <a href="${manageUrl}">${manageUrl}</a></p>`,
  });

  return !result.error;
}
