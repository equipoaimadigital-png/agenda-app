import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { updateBusinessSettings } from "@/lib/actions/dashboard";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  TRIAL: "Prueba gratis",
  ACTIVE: "Activa",
  PAST_DUE: "Pago pendiente",
  CANCELLED: "Cancelada",
};

export default async function ConfiguracionPage() {
  const professional = await requireDashboardAccess();

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
          className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand"
        >
          Ver detalle
        </Link>
      </section>

      <form
        action={updateBusinessSettings}
        className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="businessName" className="text-sm font-medium">Nombre del negocio *</label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            defaultValue={professional.businessName}
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción <span className="text-muted font-normal">(se muestra bajo el nombre)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={professional.description ?? ""}
            placeholder="Ej: Más de 10 años cuidando tu estilo. Atención personalizada en un ambiente cómodo."
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            Dirección o modalidad <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="address"
            name="address"
            type="text"
            defaultValue={professional.address ?? ""}
            placeholder="Ej: Av. Providencia 1234, Santiago — o 'Atención online'"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coverImageUrl" className="text-sm font-medium">
            Imagen de portada <span className="text-muted font-normal">(opcional — pega el link de una foto)</span>
          </label>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            defaultValue={professional.coverImageUrl ?? ""}
            placeholder="https://..."
            className="border border-border rounded-lg px-3 py-2.5"
          />
          {professional.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={professional.coverImageUrl}
              alt=""
              className="mt-1 h-24 w-full object-cover rounded-lg border border-border"
            />
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Teléfono de contacto <span className="text-muted font-normal">(opcional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={professional.phone ?? ""}
              placeholder="+56 9 1234 5678"
              className="border border-border rounded-lg px-3 py-2.5"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brandColor" className="text-sm font-medium">Color de tu marca</label>
            <input
              id="brandColor"
              name="brandColor"
              type="color"
              defaultValue={professional.brandColor}
              className="border border-border rounded-lg h-11 w-full cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cancellationHours" className="text-sm font-medium">
            Política de cancelación
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Los clientes pueden cancelar/reprogramar hasta</span>
            <input
              id="cancellationHours"
              name="cancellationHours"
              type="number"
              min={0}
              max={168}
              defaultValue={professional.cancellationHours}
              className="border border-border rounded-lg px-3 py-2 w-20 text-center"
            />
            <span className="text-sm text-muted">horas antes de la cita.</span>
          </div>
        </div>

        <button
          type="submit"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
