import { Resend } from "resend";
import { formatDateLong, wallClockOf } from "@/lib/dates";

const FROM = "Tú Agenda <onboarding@resend.dev>";

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

/**
 * Encabezado de marca para todo email transaccional. El remitente ("From")
 * ya dice "Tú Agenda", pero muchos clientes de correo ocultan ese nombre
 * detrás del email técnico (onboarding@resend.dev) — este encabezado deja
 * la marca visible dentro del cuerpo, con una línea que explica qué es.
 */
function wrapEmail(bodyHtml: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;max-width:480px;margin:0 auto;">
  <div style="font-size:20px;font-weight:600;color:#1f2e26;letter-spacing:0.01em;">Tú Agenda</div>
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7a7a70;margin-top:2px;margin-bottom:18px;">
    Reservas online para profesionales independientes.
  </div>
  <hr style="border:none;border-top:1px solid #e5e1d8;margin-bottom:18px;" />
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1f2e26;line-height:1.5;">
    ${bodyHtml}
  </div>
</div>`;
}

/** Convierte texto plano (con saltos de línea) a HTML seguro, escapando <, >, & */
function escapeAndBreak(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br/>");
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
        html: wrapEmail(`<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> quedó confirmada para el <strong>${when}</strong>.</p>
<p>Puedes ver el detalle, cancelar o reprogramar desde este link:<br/>
<a href="${manageUrl}">${manageUrl}</a></p>
<p>¡Te esperamos!</p>`),
      })
    );
  }

  tasks.push(
    client.emails.send({
      from: FROM,
      to: info.professionalEmail,
      subject: `Nueva reserva: ${info.clientName} - ${info.serviceName}`,
      html: wrapEmail(`<p>Tienes una nueva reserva.</p>
<ul>
  <li>Cliente: ${info.clientName}</li>
  <li>Teléfono: ${info.clientPhone}</li>
  <li>Servicio: ${info.serviceName}</li>
  <li>Fecha: ${when}</li>
</ul>`),
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
        html: wrapEmail(`<p>Hola ${info.clientName},</p>
<p>Lamentamos informarte que tu cita para <strong>${info.serviceName}</strong> del <strong>${when}</strong> fue cancelada por ${info.businessName}.</p>
${info.reason ? `<p>Motivo: ${info.reason}</p>` : ""}
<p>Puedes reagendar en el horario que más te acomode aquí:<br/>
<a href="${rebookUrl}">${rebookUrl}</a></p>`),
      })
    );
  }

  if (info.cancelledBy === "client") {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.professionalEmail,
        subject: `Cancelación: ${info.clientName} - ${info.serviceName}`,
        html: wrapEmail(`<p>${info.clientName} canceló su cita de <strong>${info.serviceName}</strong> del <strong>${when}</strong>.</p>
<p>El horario quedó disponible de nuevo.</p>`),
      })
    );
    if (info.clientEmail) {
      tasks.push(
        client.emails.send({
          from: FROM,
          to: info.clientEmail,
          subject: `Cancelaste tu cita con ${info.businessName}`,
          html: wrapEmail(`<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> del <strong>${when}</strong> quedó cancelada.</p>
<p>Si quieres reagendar: <a href="${rebookUrl}">${rebookUrl}</a></p>`),
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
        html: wrapEmail(`<p>Hola ${info.clientName},</p>
<p>Tu cita para <strong>${info.serviceName}</strong> cambió del ${oldWhen} al <strong>${newWhen}</strong>.</p>
<p>Detalle de tu reserva: <a href="${manageUrl}">${manageUrl}</a></p>`),
      })
    );
  }

  tasks.push(
    client.emails.send({
      from: FROM,
      to: info.professionalEmail,
      subject: `Reprogramación: ${info.clientName} - ${info.serviceName}`,
      html: wrapEmail(`<p>${info.clientName} reprogramó su cita de <strong>${info.serviceName}</strong>.</p>
<ul>
  <li>Antes: ${oldWhen}</li>
  <li>Ahora: <strong>${newWhen}</strong></li>
</ul>`),
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
    html: wrapEmail(`<p>Hola ${info.clientName},</p>
<p>Te recordamos tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> el <strong>${when}</strong>.</p>
<p>Si necesitas cancelar o reprogramar: <a href="${manageUrl}">${manageUrl}</a></p>`),
  });

  return !result.error;
}

type CampaignRecipient = { email: string; unsubscribeToken: string };

/**
 * Manda una campaña a cada destinatario por separado (nunca en un solo "to"
 * con varios correos — eso expondría la lista de clientes entre ellos). Cada
 * envío lleva su propio link de desuscripción de un clic.
 */
export async function sendCampaignEmails(info: {
  businessName: string;
  subject: string;
  body: string;
  bookingUrl: string;
  recipients: CampaignRecipient[];
}): Promise<{ sent: number }> {
  const client = getClient();
  if (!client) return { sent: 0 };

  const tasks = info.recipients.map((r) => {
    const unsubscribeUrl = `${siteUrl()}/desuscribir/${r.unsubscribeToken}`;
    return client.emails.send({
      from: FROM,
      to: r.email,
      subject: info.subject,
      html: wrapEmail(`${escapeAndBreak(info.body)}
<p style="margin-top:20px;">
  <a href="${info.bookingUrl}" style="display:inline-block;background:#2f4a3e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reservar ahora</a>
</p>
<p style="margin-top:24px;font-size:11px;color:#a0a09a;">
  Recibiste este correo porque eres cliente de ${info.businessName}.
  <a href="${unsubscribeUrl}" style="color:#a0a09a;">Dejar de recibir estos correos</a>.
</p>`),
    });
  });

  const results = await Promise.allSettled(tasks);
  let sent = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && !(r.value && typeof r.value === "object" && "error" in r.value && r.value.error)) {
      sent += 1;
    } else if (r.status === "rejected") {
      console.error("Error enviando campaña:", r.reason);
    }
  }
  return { sent };
}
