import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getBusinessThresholds } from "@/lib/client-crm";
import { computeClientSegment, SEGMENT_BADGE_CLASSES, SEGMENT_LABEL } from "@/lib/segments";
import { formatDateLong, toDateStr } from "@/lib/dates";
import { ClientEditForm } from "@/components/dashboard/ClientEditForm";

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatBirthday(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

const STATUS_BADGE: Record<string, { text: string; classes: string }> = {
  CONFIRMED: { text: "Confirmada", classes: "bg-success-soft text-success" },
  CANCELLED: { text: "Cancelada", classes: "bg-danger-soft text-danger" },
  COMPLETED: { text: "Completada", classes: "bg-brand-soft text-brand" },
  NO_SHOW: { text: "No asistió", classes: "bg-warning-soft text-warning" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const professional = await requireDashboardAccess();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, professionalId: professional.id },
    include: {
      bookings: {
        orderBy: { startTime: "desc" },
        include: { service: { select: { name: true } } },
      },
    },
  });
  if (!client) notFound();

  const now = new Date();
  const realVisits = client.bookings.filter(
    (b) => (b.status === "CONFIRMED" || b.status === "COMPLETED") && b.startTime <= now
  );
  const thresholds = await getBusinessThresholds(professional.id);
  const segment = computeClientSegment(realVisits.map((b) => b.startTime), now, thresholds);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href="/dashboard/clientes" className="text-sm text-stone hover:text-ink">
          ← Volver a Clientes
        </Link>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <h1 className="text-2xl font-semibold font-display">{client.name ?? client.phone}</h1>
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${SEGMENT_BADGE_CLASSES[segment]}`}>
            {SEGMENT_LABEL[segment]}
          </span>
        </div>
        <p className="text-sm text-stone mt-1">
          {realVisits.length} visita{realVisits.length === 1 ? "" : "s"}
          {client.birthday && <> · 🎂 {formatBirthday(client.birthday)}</>}
        </p>
      </div>

      <ClientEditForm
        client={{ id: client.id, name: client.name, phone: client.phone, email: client.email, birthday: client.birthday }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Historial de servicios</h2>
        {client.bookings.length === 0 ? (
          <p className="text-sm text-muted">Todavía no tiene reservas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {client.bookings.map((b) => {
              const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.CONFIRMED;
              const dateStr = toDateStr(b.startTime.getFullYear(), b.startTime.getMonth() + 1, b.startTime.getDate());
              return (
                <li
                  key={b.id}
                  className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.service.name}</p>
                    <p className="text-sm text-stone capitalize">{formatDateLong(dateStr)}</p>
                  </div>
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 whitespace-nowrap shrink-0 ${badge.classes}`}>
                    {badge.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
