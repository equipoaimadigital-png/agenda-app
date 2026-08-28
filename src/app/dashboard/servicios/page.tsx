import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  addServiceField,
  createService,
  deleteService,
  deleteServiceField,
  toggleServiceActive,
  updateServiceDeposit,
} from "@/lib/actions/services";
import { formatServicePrice } from "@/lib/price";
import { ServicePriceFields } from "@/components/dashboard/ServicePriceFields";

export default async function ServiciosPage() {
  const professional = await requireDashboardAccess();
  const mpConnected = !!professional.mpConnectedUserId;

  const services = await prisma.service.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "asc" },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Servicios</h1>
        <p className="text-sm text-muted mt-1">
          Lo que tus clientes pueden reservar. La descripción y el precio se muestran
          en tu página pública.
        </p>
      </div>

      <form
        action={createService}
        className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">Nombre del servicio *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej: Corte de pelo"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción <span className="text-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Ej: Incluye lavado y peinado"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="durationMin" className="text-sm font-medium">Duración (min) *</label>
          <input
            id="durationMin"
            name="durationMin"
            type="number"
            min={5}
            step={5}
            required
            placeholder="30"
            className="border border-border rounded-lg px-3 py-2.5"
          />
        </div>
        <ServicePriceFields />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">
            Depósito para asegurar la reserva{" "}
            <span className="text-muted font-normal">(opcional)</span>
          </legend>
          {mpConnected ? (
            <>
              <select
                name="depositMode"
                defaultValue="NONE"
                aria-label="Modo del depósito"
                className="border border-border rounded-lg px-3 py-2.5 bg-surface"
              >
                <option value="NONE">Sin depósito</option>
                <option value="OPTIONAL">Opcional — el cliente elige si asegura su hora</option>
                <option value="REQUIRED">Obligatorio — no se confirma sin pagar</option>
              </select>
              <input
                name="depositAmount"
                type="number"
                min={0}
                step={500}
                placeholder="Monto del depósito (ej: 5000)"
                className="border border-border rounded-lg px-3 py-2.5"
              />
              <p className="text-xs text-muted">
                El depósito llega directo a tu cuenta de Mercado Pago. Solo se aplica si eliges
                un modo y pones un monto.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted bg-brand-soft rounded-lg px-3 py-2">
              Conecta tu cuenta de Mercado Pago en{" "}
              <Link href="/dashboard/configuracion" className="underline">
                Configuración
              </Link>{" "}
              para poder pedir depósito en este servicio.
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
        >
          Agregar servicio
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {services.length === 0 && (
          <p className="text-sm text-muted">Aún no tienes servicios.</p>
        )}
        {services.map((service) => (
          <li
            key={service.id}
            className={`bg-surface border border-border rounded-xl px-4 py-3 flex flex-col gap-3 ${
              service.active ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {service.name}
                  {!service.active && (
                    <span className="ml-2 text-xs bg-warning-soft text-warning rounded-full px-2 py-0.5">
                      Pausado
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">
                  {service.durationMin} min
                  {(() => {
                    const label = formatServicePrice(service.price, service.priceType);
                    return label ? ` · ${label}` : "";
                  })()}
                </p>
                {service.description && (
                  <p className="text-sm text-muted mt-0.5">{service.description}</p>
                )}
                {service.depositMode !== "NONE" && service.depositAmount && (
                  <p className="text-xs text-brand mt-0.5">
                    💳 Depósito{" "}
                    {service.depositMode === "REQUIRED" ? "obligatorio" : "opcional"} de $
                    {service.depositAmount.toLocaleString("es-CL")}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <form action={toggleServiceActive.bind(null, service.id)}>
                  <button
                    type="submit"
                    className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
                  >
                    {service.active ? "Pausar" : "Activar"}
                  </button>
                </form>
                <form action={deleteService.bind(null, service.id)}>
                  <button
                    type="submit"
                    className="text-sm border border-border rounded-lg px-3 py-1.5 text-danger hover:border-danger active:scale-[0.97]"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>

            {mpConnected && (
              <details className="border-t border-border pt-3">
                <summary className="text-sm font-medium cursor-pointer text-stone hover:text-ink">
                  Depósito para asegurar la reserva
                </summary>
                <form
                  action={updateServiceDeposit.bind(null, service.id)}
                  className="mt-3 flex flex-col gap-2"
                >
                  <select
                    name="depositMode"
                    defaultValue={service.depositMode}
                    aria-label="Modo del depósito"
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                  >
                    <option value="NONE">Sin depósito</option>
                    <option value="OPTIONAL">Opcional — el cliente elige</option>
                    <option value="REQUIRED">Obligatorio</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="depositAmount"
                      min={0}
                      step={500}
                      defaultValue={service.depositAmount ?? ""}
                      placeholder="Monto (ej: 5000)"
                      className="border border-border rounded-lg px-3 py-2 text-sm flex-1"
                    />
                    <button
                      type="submit"
                      className="border border-border bg-surface rounded-lg px-3 py-2 text-sm font-medium hover:border-brand active:scale-[0.97]"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </details>
            )}

            <details className="border-t border-border pt-3">
              <summary className="text-sm font-medium cursor-pointer text-stone hover:text-ink">
                Preguntas personalizadas al reservar ({service.fields.length})
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {service.fields.map((field) => (
                  <form
                    key={field.id}
                    action={deleteServiceField.bind(null, field.id)}
                    className="flex items-center justify-between gap-2 bg-brand-soft rounded-lg px-3 py-2 text-sm"
                  >
                    <span>
                      {field.label}
                      {field.required && <span className="text-danger"> *</span>}
                      {field.type === "SELECT" && (
                        <span className="text-muted"> ({field.options.join(" / ")})</span>
                      )}
                    </span>
                    <button
                      type="submit"
                      aria-label="Eliminar pregunta"
                      className="text-danger font-medium hover:opacity-70 active:scale-[0.9] shrink-0"
                    >
                      ×
                    </button>
                  </form>
                ))}

                <form
                  action={addServiceField}
                  className="flex flex-col gap-2 border border-border rounded-lg p-3"
                >
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input
                    type="text"
                    name="label"
                    required
                    placeholder="Ej: ¿Ya iniciaste el trámite?"
                    className="border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      name="type"
                      className="border border-border rounded-lg px-2 py-1.5 text-sm bg-surface"
                    >
                      <option value="TEXT">Texto libre</option>
                      <option value="SELECT">Opción múltiple</option>
                    </select>
                    <input
                      type="text"
                      name="options"
                      placeholder="Opciones separadas por coma (si es opción múltiple)"
                      className="border border-border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-40"
                    />
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="required" className="accent-(--brand)" />
                      Obligatoria
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="self-start border border-border bg-surface rounded-lg px-3 py-1.5 text-sm font-medium hover:border-brand active:scale-[0.97]"
                  >
                    Agregar pregunta
                  </button>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
