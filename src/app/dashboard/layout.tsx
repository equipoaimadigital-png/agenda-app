import { getCurrentProfessional } from "@/lib/auth-helpers";
import { signOut } from "@/lib/actions/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const professional = await getCurrentProfessional();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const publicUrl = professional ? `${siteUrl}/reservar/${professional.slug}` : "";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ "--brand": professional?.brandColor ?? "#0f766e" } as React.CSSProperties}
    >
      <aside className="w-full md:w-64 md:min-h-screen bg-surface border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="w-10 h-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center font-semibold"
          >
            {(professional?.businessName ?? "N").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {professional?.businessName ?? "Mi negocio"}
            </p>
            <p className="text-xs text-muted">Panel profesional</p>
          </div>
        </div>

        {professional && (
          <div className="bg-brand-soft rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs font-medium">Tu página de reservas</p>
            <p className="text-xs text-muted break-all">/reservar/{professional.slug}</p>
            <div className="flex gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium bg-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-brand"
              >
                Ver página
              </a>
              <CopyLinkButton url={publicUrl} />
            </div>
          </div>
        )}

        <DashboardNav />

        <form action={signOut} className="mt-auto pt-4">
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-4xl">{children}</main>
    </div>
  );
}
