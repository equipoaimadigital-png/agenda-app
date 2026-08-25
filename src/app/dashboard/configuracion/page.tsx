import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { CoverImageUploader } from "@/components/dashboard/CoverImageUploader";
import { ConfiguracionForm } from "@/components/dashboard/ConfiguracionForm";
import { MercadoPagoConnectCard } from "@/components/dashboard/MercadoPagoConnectCard";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  TRIAL: "Prueba gratis",
  ACTIVE: "Activa",
  PAST_DUE: "Pago pendiente",
  CANCELLED: "Cancelada",
};

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ mp_connect_error?: string }>;
}) {
  const professional = await requireDashboardAccess();
  const { mp_connect_error } = await searchParams;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Configuración</h1>
        <p className="text-sm text-muted mt-1">
          Cómo se presenta tu negocio en tu página pública de reservas.
        </p>
      </div>

      <section className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted">Suscripción</p>
          <p className="font-medium">
            {SUBSCRIPTION_LABEL[professional.subscriptionStatus] ?? professional.subscriptionStatus}
          </p>
        </div>
        <Link
          href="/dashboard/suscripcion"
          className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
        >
          Ver detalle
        </Link>
      </section>

      <MercadoPagoConnectCard
        connected={!!professional.mpConnectedUserId}
        connectedAt={professional.mpConnectedAt}
        initialError={mp_connect_error === "1"}
      />

      <div className="bg-surface border border-border rounded-xl p-4">
        <CoverImageUploader currentUrl={professional.coverImageUrl} />
      </div>

      <ConfiguracionForm
        businessName={professional.businessName}
        description={professional.description}
        address={professional.address}
        phone={professional.phone}
        brandColor={professional.brandColor}
        headingFont={professional.headingFont}
        headingSize={professional.headingSize}
        websiteUrl={professional.websiteUrl}
        instagramUrl={professional.instagramUrl}
        facebookUrl={professional.facebookUrl}
        cancellationHours={professional.cancellationHours}
      />
    </div>
  );
}
