import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CampaignForm } from "@/components/dashboard/CampaignForm";
import { DeleteCampaignButton } from "@/components/dashboard/DeleteCampaignButton";
import { PlaybookCard } from "@/components/dashboard/PlaybookCard";
import { getPlaybooks } from "@/lib/playbooks";
import { formatDateLong, toDateStr } from "@/lib/dates";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Todos los clientes",
  INACTIVE_30D: "Inactivos 30+ días",
  CUSTOM: "Clientes específicos",
};

export default async function CampanasPage() {
  const professional = await requireDashboardAccess();

  const [campaigns, playbooks] = await Promise.all([
    prisma.emailCampaign.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getPlaybooks(professional.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Campañas de email</h1>
        <p className="text-sm text-stone mt-1">
          Manda un correo a tus clientes para reactivarlos, avisar promociones o novedades.
        </p>
      </div>

      {playbooks.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="font-semibold">Sugerencias para ti</h2>
            <p className="text-sm text-muted">
              Campañas listas según cómo se comportan tus clientes. Edítalas antes de enviar.
            </p>
          </div>
          <div className="grid gap-2">
            {playbooks.map((pb) => (
              <PlaybookCard
                key={pb.id}
                id={pb.id}
                title={pb.title}
                why={pb.why}
                tip={pb.tip}
                subject={pb.subject}
                body={pb.body}
                targetCount={pb.targets.length}
              />
            ))}
          </div>
        </section>
      )}

      <CampaignForm
        businessName={professional.businessName}
        coverImageUrl={professional.coverImageUrl}
        brandColor={professional.brandColor}
      />

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
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-medium">
                    {c.recipientCount} enviado{c.recipientCount === 1 ? "" : "s"}
                  </span>
                  <DeleteCampaignButton campaignId={c.id} />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
