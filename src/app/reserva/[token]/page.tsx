import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ManageBookingActions } from "@/components/booking/ManageBookingActions";
import { PayDepositButton } from "@/components/booking/PayDepositButton";
import { Seal } from "@/components/ui/Seal";
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
  PENDING_PAYMENT: { text: "Pendiente de pago", classes: "bg-warning-soft text-warning" },
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
      <main className="min-h-screen flex items-center justify-center p-6 text-center bg-paper">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold font-display">Reserva no encontrada</h1>
          <p className="text-stone mt-2">
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
  const isNew = !!nueva && booking.status === "CONFIRMED";

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
      className="min-h-screen bg-paper"
      style={{ "--brand": professional.brandColor } as React.CSSProperties}
    >
      <div className="max-w-lg mx-auto px-5 py-6 sm:py-10 flex flex-col gap-5">
        <Link
          href={`/reservar/${professional.slug}`}
          className="text-sm text-stone hover:text-ink w-fit"
        >
          ← Volver a {professional.businessName}
        </Link>

        {isNew && (
          <div
            role="status"
            className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center text-center gap-3 seal-stamp-in"
          >
            <Seal size={64}>
              <span className="text-2xl" style={{ color: "var(--brass)" }} aria-hidden>
                ✓
              </span>
            </Seal>
            {/* El texto explícito es el mensaje principal; el sello es refuerzo visual */}
            <div>
              <p className="font-display text-xl sm:text-2xl leading-snug">
                Reserva confirmada
              </p>
              <p className="text-ink mt-1">
                Te esperamos el <strong className="capitalize">{formatDateLong(dateStr)}</strong>{" "}
                a las <strong>{time}</strong>.
              </p>
            </div>
            <p className="text-sm text-stone">
              Guarda esta página: desde aquí puedes ver, cancelar o reprogramar tu cita cuando quieras.
            </p>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-stone">Tu cita con</p>
              <h1 className="text-xl font-semibold font-display">{professional.businessName}</h1>
            </div>
            <span className={`text-xs font-medium rounded-full px-3 py-1 whitespace-nowrap ${status.classes}`}>
              {status.text}
            </span>
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone">Servicio</dt>
              <dd className="font-medium text-right">{service.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">Fecha</dt>
              <dd className="font-medium text-right capitalize font-numeric">{formatDateLong(dateStr)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">Hora</dt>
              <dd className="font-medium text-right font-numeric">{time} ({service.durationMin} min)</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone">A nombre de</dt>
              <dd className="font-medium text-right">{booking.clientName}</dd>
            </div>
            {professional.address && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone">Dirección</dt>
                <dd className="font-medium text-right">{professional.address}</dd>
              </div>
            )}
          </dl>

          {booking.status === "CANCELLED" && booking.cancelReason && (
            <p className="text-sm text-stone border-t border-border pt-3">
              Motivo: {booking.cancelReason}
            </p>
          )}
        </div>

        {booking.status === "PENDING_PAYMENT" && booking.depositAmount && (
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 text-center">
            <p className="text-sm text-stone">
              Este horario está reservado para ti, pero todavía falta pagar el depósito para
              confirmarlo. Si cerraste la ventana de pago sin terminar, puedes intentar de nuevo aquí.
            </p>
            <PayDepositButton token={token} amount={booking.depositAmount} />
          </div>
        )}

        {booking.status === "CONFIRMED" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border-strong bg-surface rounded-lg px-4 py-3 sm:py-2.5 text-sm font-medium text-center hover:border-brand"
            >
              📅 Agregar a Google Calendar
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-success text-white rounded-lg px-4 py-3 sm:py-2.5 text-sm font-medium text-center"
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
            staffId={booking.staffId}
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
