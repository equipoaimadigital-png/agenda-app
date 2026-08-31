import { Resend } from "resend";
import { formatDateLong, wallClockOf } from "@/lib/dates";
import { personalizeCampaignBody } from "@/lib/campaign-copy";
import { contrastRatio } from "@/lib/color-contrast";

const FROM = "Tu Hora Lista <notificaciones@tuhoralista.com>";
const SUPPORT_EMAIL = "soporte@tuhoralista.com";

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
 * ya dice "Tu Hora Lista", pero muchos clientes de correo ocultan ese nombre
 * detrás del email técnico (onboarding@resend.dev) — este encabezado deja
 * la marca visible dentro del cuerpo, con una línea que explica qué es.
 */
function wrapEmail(bodyHtml: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;max-width:480px;margin:0 auto;">
  <div style="font-size:20px;font-weight:600;color:#1f2e26;letter-spacing:0.01em;">Tu Hora Lista</div>
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
export function escapeAndBreak(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br/>");
}

/** Escapa para texto Y para valores de atributo (incluye comillas dobles). */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Un color de marca que no venga como #rrggbb se descarta — nunca se
 *  interpola texto arbitrario del profesional dentro de un `style`. */
function sanitizeHex(hex: string | null | undefined, fallback = "#2f4a3e"): string {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : fallback;
}

/** URL sólo si es http(s) sin caracteres que rompan un atributo. `httpsOnly`
 *  para imágenes (los clientes de correo bloquean http / contenido mixto). */
function safeUrl(url: string | null | undefined, opts?: { httpsOnly?: boolean }): string | null {
  if (!url) return null;
  const re = opts?.httpsOnly ? /^https:\/\/[^\s"'<>]+$/i : /^https?:\/\/[^\s"'<>]+$/i;
  return re.test(url) ? url : null;
}

/**
 * Identidad del negocio para el correo de campaña. Todo sale de la fila del
 * profesional (imagen de portada + color de marca + redes) — no hay que
 * pedirle nada nuevo ni subir a Canva.
 */
export type CampaignBranding = {
  businessName: string;
  tagline: string | null;
  brandColor: string;
  coverImageUrl: string | null;
  includeCover: boolean;
  bookingUrl: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  whatsappUrl: string | null;
  mapsUrl: string | null;
};

/**
 * Arma el HTML completo de un correo de campaña con la marca del negocio.
 * Basado en tablas + estilos inline (Gmail / Outlook / Apple Mail). La
 * cabecera de color y el nombre en texto real garantizan identidad aunque
 * el cliente de correo bloquee las imágenes. Un GIF animado como portada se
 * anima solo (Outlook de escritorio muestra el primer cuadro).
 *
 * NO reemplaza a `wrapEmail()`, que sigue sirviendo a los correos
 * transaccionales (confirmación, recordatorio, cancelación…).
 */
export function renderCampaignEmail(opts: {
  branding: CampaignBranding;
  /** Ya escapado y con <br/> — cuerpo personalizado del mensaje. */
  bodyHtml: string;
  /** Ya escapado — línea de pie (desuscripción o aviso de prueba). */
  footerNoteHtml: string;
}): string {
  const b = opts.branding;
  const brand = sanitizeHex(b.brandColor);
  const onBrand = contrastRatio(brand, "#ffffff") >= 4.5 ? "#ffffff" : "#20261f";
  const onBrandMuted =
    onBrand === "#ffffff" ? "rgba(255,255,255,0.82)" : "rgba(31,38,32,0.70)";
  const cover = b.includeCover ? safeUrl(b.coverImageUrl, { httpsOnly: true }) : null;
  const name = esc(b.businessName);
  const bookingUrl = esc(safeUrl(b.bookingUrl) ?? b.bookingUrl);

  const chips: { url: string; label: string }[] = [];
  for (const [raw, label] of [
    [b.instagramUrl, "Instagram"],
    [b.facebookUrl, "Facebook"],
    [b.whatsappUrl, "WhatsApp"],
    [b.mapsUrl, "Cómo llegar"],
  ] as [string | null, string][]) {
    const url = safeUrl(raw);
    if (url) chips.push({ url, label });
  }

  const bannerImg = cover
    ? `<tr><td style="padding:0;line-height:0;font-size:0;">
        <img src="${esc(cover)}" alt="${name}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
      </td></tr>`
    : "";

  const chipsHtml = chips.length
    ? `<tr><td style="padding:4px 24px 22px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9a9484;margin-bottom:9px;">Síguenos</div>
        ${chips
          .map(
            (c) =>
              `<a href="${esc(c.url)}" style="display:inline-block;font-size:12px;color:#5a5648;text-decoration:none;border:1px solid #e3ddcd;border-radius:999px;padding:5px 12px;margin:3px;">${c.label}</a>`
          )
          .join("")}
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;">
  <tr><td align="center" style="padding:16px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e8e3d6;border-radius:14px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      ${bannerImg}
      <tr><td style="background:${brand};padding:20px 22px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:600;color:${onBrand};line-height:1.15;">${name}</div>
        ${b.tagline ? `<div style="font-size:12px;color:${onBrandMuted};margin-top:3px;">${esc(b.tagline)}</div>` : ""}
      </td></tr>
      <tr><td style="padding:24px 24px 4px;font-size:15px;line-height:1.62;color:#20261f;">
        ${opts.bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 24px 6px;text-align:center;">
        <a href="${bookingUrl}" style="display:inline-block;background:${brand};color:${onBrand};font-weight:600;font-size:15px;padding:13px 32px;border-radius:10px;text-decoration:none;">Reservar ahora</a>
      </td></tr>
      ${chipsHtml}
      <tr><td style="border-top:1px solid #ece7db;background:#faf8f2;padding:15px 24px;">
        <div style="font-size:11px;line-height:1.5;color:#9a968a;">${opts.footerNoteHtml}</div>
        <div style="font-size:10px;color:#bdb9ac;margin-top:7px;">Enviado con Tu Hora Lista</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
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

  const safeName = escapeAndBreak(info.clientName);
  const safePhone = escapeAndBreak(info.clientPhone);

  if (info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Confirmación de tu cita con ${info.businessName}`,
        html: wrapEmail(`<p>Hola ${safeName},</p>
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
  <li>Cliente: ${safeName}</li>
  <li>Teléfono: ${safePhone}</li>
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

  const safeName = escapeAndBreak(info.clientName);
  const safeReason = info.reason ? escapeAndBreak(info.reason) : null;

  if (info.cancelledBy === "professional" && info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Tu cita con ${info.businessName} fue cancelada`,
        html: wrapEmail(`<p>Hola ${safeName},</p>
<p>Lamentamos informarte que tu cita para <strong>${info.serviceName}</strong> del <strong>${when}</strong> fue cancelada por ${info.businessName}.</p>
${safeReason ? `<p>Motivo: ${safeReason}</p>` : ""}
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
        html: wrapEmail(`<p>${safeName} canceló su cita de <strong>${info.serviceName}</strong> del <strong>${when}</strong>.</p>
<p>El horario quedó disponible de nuevo.</p>`),
      })
    );
    if (info.clientEmail) {
      tasks.push(
        client.emails.send({
          from: FROM,
          to: info.clientEmail,
          subject: `Cancelaste tu cita con ${info.businessName}`,
          html: wrapEmail(`<p>Hola ${safeName},</p>
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

  const safeName = escapeAndBreak(info.clientName);

  if (info.clientEmail) {
    tasks.push(
      client.emails.send({
        from: FROM,
        to: info.clientEmail,
        subject: `Tu cita con ${info.businessName} fue reprogramada`,
        html: wrapEmail(`<p>Hola ${safeName},</p>
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
      html: wrapEmail(`<p>${safeName} reprogramó su cita de <strong>${info.serviceName}</strong>.</p>
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
    html: wrapEmail(`<p>Hola ${escapeAndBreak(info.clientName)},</p>
<p>Te recordamos tu cita para <strong>${info.serviceName}</strong> con <strong>${info.businessName}</strong> el <strong>${when}</strong>.</p>
<p>Si necesitas cancelar o reprogramar: <a href="${manageUrl}">${manageUrl}</a></p>`),
  });

  return !result.error;
}

type CampaignRecipient = { email: string; unsubscribeToken: string; name: string | null };

/**
 * Manda una campaña a cada destinatario por separado (nunca en un solo "to"
 * con varios correos — eso expondría la lista de clientes entre ellos). Cada
 * envío lleva su propio link de desuscripción de un clic. Si el mensaje
 * incluye {{Nombre Cliente}}, se reemplaza por el nombre real de cada uno.
 */
export async function sendCampaignEmails(info: {
  branding: CampaignBranding;
  subject: string;
  body: string;
  recipients: CampaignRecipient[];
}): Promise<{ sent: number }> {
  const client = getClient();
  if (!client) return { sent: 0 };

  const businessName = esc(info.branding.businessName);

  const tasks = info.recipients.map((r) => {
    const unsubscribeUrl = `${siteUrl()}/desuscribir/${r.unsubscribeToken}`;
    return client.emails.send({
      from: FROM,
      to: r.email,
      subject: info.subject,
      html: renderCampaignEmail({
        branding: info.branding,
        bodyHtml: escapeAndBreak(personalizeCampaignBody(info.body, r.name)),
        footerNoteHtml: `Recibiste este correo porque eres cliente de <strong style="color:#7a766a;">${businessName}</strong>. <a href="${esc(unsubscribeUrl)}" style="color:#9a968a;">Dejar de recibir estos correos</a>.`,
      }),
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

/** Envío de prueba de una campaña — solo al propio profesional, sin tocar destinatarios reales. */
export async function sendTestCampaignEmail(info: {
  branding: CampaignBranding;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const result = await client.emails.send({
    from: FROM,
    to: info.toEmail,
    subject: `[Prueba] ${info.subject}`,
    html: renderCampaignEmail({
      branding: info.branding,
      bodyHtml: escapeAndBreak(personalizeCampaignBody(info.body, "María")),
      footerNoteHtml: "Este es un envío de prueba — no llegó a ningún cliente.",
    }),
  });

  return !result.error;
}

/**
 * Manda un mensaje de soporte al equipo de la plataforma. El remitente ("reply-to")
 * queda como el correo del propio negocio, para poder contestarle directo con Responder.
 */
export async function sendSupportEmail(info: {
  businessName: string;
  slug: string;
  professionalEmail: string;
  professionalPhone: string | null;
  category: string;
  message: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const result = await client.emails.send({
    from: FROM,
    to: SUPPORT_EMAIL,
    replyTo: info.professionalEmail,
    subject: `[Soporte] ${info.category} — ${info.businessName}`,
    html: wrapEmail(`<p><strong>Negocio:</strong> ${info.businessName} (/reservar/${info.slug})</p>
<p><strong>Correo de contacto:</strong> ${info.professionalEmail}</p>
${info.professionalPhone ? `<p><strong>Teléfono:</strong> ${info.professionalPhone}</p>` : ""}
<p><strong>Categoría:</strong> ${info.category}</p>
<hr style="border:none;border-top:1px solid #e5e1d8;margin:16px 0;" />
${escapeAndBreak(info.message)}`),
  });

  return !result.error;
}
