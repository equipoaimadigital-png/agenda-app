import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ManageBookingActions } from "@/components/booking/ManageBookingActions";
import { buildGoogleCalendarUrl, formatDateLong, wallClockOf } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Mi reserva",
  robots: { index: false },
};

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nueva?: string; wa?: string }>;
};

const STATUS_LABEL: Record<string, { text: string; classes: string }> = {
  CONFIRMED: { text: "Confirmada", classes: "bg-success-soft text-success" },
  CANCELLED: { text: "Cancelada", classes: "bg-danger-soft text-danger" },
  COMPLETED: { text: "Completada", classes: "bg-brand-soft text-brand" },
  NO_SHOW: { text: "No asistió", classes: "bg-warning-soft text-warning" },
};

export default async function MiReservaPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { nueva, wa } = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { professional: true, service: true },
  });

  if (!booking) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">Reserva no encontrada</h1>
          <p className="text-muted mt-2">
            Este link no corresponde a ninguna reserva. Revisa el enlace de tu
            correo de confirmación.
          </p>
        </div>
      </main>
    );
  }

  const { professional, service } = booking;
  const { dateStr, time } = wallClockOf(booking.startTime);
  const status = STATUS_LABEL[booking.status] ?? STATUS_LABEL.CONFIRMED;

  const canModify =
    booking.status === "CONFIRMED" &&
    new Date() < new Date(booking.startTime.getTime() - professional.cancellationHours * 3600_000);

  const calendarUrl = buildGoogleCalendarUrl({
    title: `${service.name} — ${professional.businessName}`,
    dateStr,
    startTime: time,
    durationMin: service.durationMin,
    details: `Reserva confirmada con ${professional.businessName}.`,
    location: professional.address ?? undefined,
  });

  return (
    <main
      className="min-h-screen"
      style={{ "--brand": professional.brandColor } as React.CSSProperties}
    >
      <div className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-5">
        {nueva && booking.status === "CONFIRMED" && (
          <div className="bg-success-soft border border-border rounded-xl p-4">
            <p className="font-semibold text-success">¡Tu reserva quedó confirmada! 🎉</p>
            <p className="text-sm mt-1">
              Guarda esta página: desde aquí puedes ver, cancelar o reprogramar tu cita.
            </p>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Tu cita con</p>
              <h1 className="text-xl font-semibold">{professional.businessName}</h1>
            </div>
            <span className={`text-xs font-medium rounded-full px-3 py-1 ${status.classes}`}>
              {status.text}
            </span>
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Servicio</dt>
              <dd className="font-medium text-right">{service.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fecha</dt>
              <dd className="font-medium text-right capitalize">{formatDateLong(dateStr)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Hora</dt>
              <dd className="font-medium text-right">{time} ({service.durationMin} min)</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">A nombre de</dt>
              <dd className="font-medium text-right">{booking.clientName}</dd>
            </div>
            {professional.address && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Dirección</dt>
                <dd className="font-medium text-right">{professional.address}</dd>
              </div>
            )}
          </dl>

          {booking.status === "CANCELLED" && booking.cancelReason && (
            <p className="text-sm text-muted border-t border-border pt-3">
              Motivo: {booking.cancelReason}
            </p>
          )}
        </div>

        {booking.status === "CONFIRMED" && (
          <div className="flex flex-wrap gap-3">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border bg-surface rounded-lg px-4 py-2.5 text-sm font-medium hover:border-brand"
            >
              📅 Agregar a Google Calendar
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-success text-white rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                Compartir por WhatsApp
              </a>
            )}
          </div>
        )}

        {booking.status === "CONFIRMED" && (
          <ManageBookingActions
            token={token}
            slug={professional.slug}
            serviceId={service.id}
            canModify={canModify}
            cancellationHours={professional.cancellationHours}
          />
        )}

        {booking.status === "CANCELLED" && (
          <Link
            href={`/reservar/${professional.slug}`}
            className="bg-brand text-brand-foreground rounded-lg px-4 py-3 text-center font-medium"
          >
            Reservar una nueva hora
          </Link>
        )}
      </div>
    </main>
  );
}
