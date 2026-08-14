import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CampaignForm } from "@/components/dashboard/CampaignForm";
import { formatDateLong, toDateStr } from "@/lib/dates";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Todos los clientes",
  INACTIVE_30D: "Inactivos 30+ días",
  CUSTOM: "Clientes específicos",
};

export default async function CampanasPage() {
  const professional = await requireDashboardAccess();

  const campaigns = await prisma.emailCampaign.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Campañas de email</h1>
        <p className="text-sm text-stone mt-1">
          Manda un correo a tus clientes para reactivarlos, avisar promociones o novedades.
        </p>
      </div>

      <CampaignForm businessName={professional.businessName} />

      <section className="flex flex-col gap-2 max-w-xl">
        <h2 className="font-semibold">Historial</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted">Todavía no has enviado ninguna campaña.</p>
        ) : (
          campaigns.map((c) => {
            const dateStr = toDateStr(
              c.createdAt.getFullYear(),
              c.createdAt.getMonth() + 1,
              c.createdAt.getDate()
            );
            return (
              <div
                key={c.id}
                className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.subject}</p>
                  <p className="text-xs text-muted">
                    <span className="capitalize">{formatDateLong(dateStr)}</span> ·{" "}
                    {AUDIENCE_LABEL[c.audience] ?? c.audience}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0">
                  {c.recipientCount} enviado{c.recipientCount === 1 ? "" : "s"}
                </span>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
