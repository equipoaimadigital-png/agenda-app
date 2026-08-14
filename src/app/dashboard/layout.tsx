import { getCurrentProfessional } from "@/lib/auth-helpers";
import { signOut } from "@/lib/actions/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { TrialWarningBanner } from "@/components/dashboard/TrialWarningBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const professional = await getCurrentProfessional();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const publicUrl = professional ? `${siteUrl}/reservar/${professional.slug}` : "";

  const daysLeft =
    professional?.subscriptionStatus === "TRIAL" && professional.trialEndsAt
      ? Math.ceil((professional.trialEndsAt.getTime() - Date.now()) / 86_400_000)
      : null;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-paper"
      style={{ "--brand": professional?.brandColor ?? "#2f4a3e" } as React.CSSProperties}
    >
      <aside className="w-full md:w-64 md:min-h-screen bg-ink text-white border-b md:border-b-0 md:border-r border-black/20 p-4 flex flex-col gap-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-10 h-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center font-semibold ring-1 ring-white/15"
          >
            {(professional?.businessName ?? "N").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-display truncate leading-tight">
              {professional?.businessName ?? "Mi negocio"}
            </p>
            <p className="text-xs text-white/60">Panel profesional</p>
          </div>
        </div>

        {professional && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-white/80">Tu página de reservas</p>
            <p className="text-xs text-white/50 break-all">/reservar/{professional.slug}</p>
            <div className="flex gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 hover:bg-white/15"
              >
                Ver página
              </a>
              <CopyLinkButton url={publicUrl} dark />
            </div>
          </div>
        )}

        <DashboardNav />

        <form action={signOut} className="mt-auto pt-4 border-t border-white/10">
          <button type="submit" className="text-sm text-white/60 hover:text-white pt-4">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-4xl">{children}</main>

      {professional && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && (
        <TrialWarningBanner professionalId={professional.id} daysLeft={daysLeft} />
      )}
    </div>
  );
}
