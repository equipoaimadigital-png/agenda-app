"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPublicBooking,
  getServiceFields,
  getStaffForService,
  type CreateBookingResult,
  type ServiceFieldView,
  type StaffOptionView,
} from "@/lib/actions/bookings";
import { ANY_STAFF, type StaffSelection } from "@/lib/booking-logic";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { ConfirmationModal } from "@/components/booking/ConfirmationModal";
import { formatDateLong } from "@/lib/dates";
import { formatServicePrice, type ServicePriceType } from "@/lib/price";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
  priceType: ServicePriceType;
};

export function BookingWidget({
  slug,
  services,
}: {
  slug: string;
  services: Service[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ dateStr: string; time: string } | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});
  const [fields, setFields] = useState({ name: "", phone: "", email: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [staffOptions, setStaffOptions] = useState<StaffOptionView[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSelection, setStaffSelection] = useState<StaffSelection>(ANY_STAFF);

  const [serviceFields, setServiceFields] = useState<ServiceFieldView[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const service = services.find((s) => s.id === serviceId) ?? null;

  // Reset al cambiar de servicio: se calcula durante el render (patrón
  // recomendado por React para "ajustar estado cuando cambia una prop/id"),
  // no dentro de un efecto — evita el re-render extra que provoca un
  // setState síncrono en el cuerpo de un efecto.
  const [prevServiceId, setPrevServiceId] = useState<string | null>(service?.id ?? null);
  if ((service?.id ?? null) !== prevServiceId) {
    setPrevServiceId(service?.id ?? null);
    setStaffOptions([]);
    setStaffSelection(ANY_STAFF);
    setPicked(null);
    setServiceFields([]);
    setCustomValues({});
    if (service) setLoadingStaff(true);
  }

  function closeModal() {
    setServiceId(null);
    setPicked(null);
  }

  // Con el modal abierto, bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    if (!service) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [service]);

  // Dentro del modal, una vez elegida la fecha/hora, baja a la sección de datos.
  const step3Ref = useRef<HTMLElement>(null);

  // Al elegir servicio, carga qué profesionales pueden realizarlo
  // (el reset de estado al cambiar de servicio vive arriba, fuera del efecto)
  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    getStaffForService(slug, service.id).then((options) => {
      if (!cancelled) {
        setStaffOptions(options);
        setLoadingStaff(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, service?.id]);

  // Al elegir servicio, carga sus preguntas personalizadas (si tiene)
  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    getServiceFields(service.id).then((fields) => {
      if (cancelled) return;
      setServiceFields(fields);
      setCustomValues(
        Object.fromEntries(
          fields.map((f) => [f.id, f.type === "SELECT" ? f.options[0] ?? "" : ""])
        )
      );
    });
    return () => {
      cancelled = true;
    };
  }, [service?.id]);

  useEffect(() => {
    if (picked) {
      step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [picked]);

  const [state, formAction, isPending] = useActionState<CreateBookingResult, FormData>(
    async (_prev, formData) => {
      const result = await createPublicBooking(formData);
      if (result.redirectUrl) {
        // El servicio pide depósito: al checkout de Mercado Pago directo,
        // sin mostrar el modal de "confirmada" (todavía no lo está).
        window.location.href = result.redirectUrl;
        return result;
      }
      if (result.success && result.manageToken) {
        // Muestra el modal de confirmación ANTES de redirigir
        setShowConfirmation(true);
      }
      return result;
    },
    {}
  );

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    if (state.success && state.manageToken) {
      const wa = state.whatsappLink ? `&wa=${encodeURIComponent(state.whatsappLink)}` : "";
      router.push(`/reserva/${state.manageToken}?nueva=1${wa}`);
    }
  };

  const nameError = touched.name && fields.name.trim().length < 2 ? "Escribe tu nombre." : null;
  const phoneError =
    touched.phone && fields.phone.replace(/[^0-9]/g, "").length < 8
      ? "Escribe un teléfono válido (mínimo 8 dígitos)."
      : null;
  const emailError =
    touched.email && fields.email.length > 0 && !/^\S+@\S+\.\S+$/.test(fields.email)
      ? "Ese email no parece válido."
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Paso 1: servicio */}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          1 · Elige el servicio
        </h2>
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_rgba(0,0,0,0.06)]">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer transition-colors hover:bg-paper"
            >
              <div className="min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted font-medium whitespace-nowrap">
                  {s.durationMin} min
                  {(() => {
                    const label = formatServicePrice(s.price, s.priceType);
                    return label ? ` · ${label}` : "";
                  })()}
                </p>
                {s.description && (
                  <p className="text-sm text-muted mt-1">{s.description}</p>
                )}
              </div>
              <span className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold bg-brand text-brand-foreground shadow-[0_3px_0_rgba(0,0,0,0.18),0_6px_14px_rgba(0,0,0,0.14)]">
                Agendar
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Modal de agendamiento: profesional, fecha/hora y datos, todo dentro del flujo de "Agendar" */}
      {service && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Agendar ${service.name}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-paper w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-h-[92vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-paper border-b border-border px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-muted font-medium">
                  {service.durationMin} min
                  {(() => {
                    const label = formatServicePrice(service.price, service.priceType);
                    return label ? ` · ${label}` : "";
                  })()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar"
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-border/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-6">
              {/* Elegir profesional (si hay más de uno) */}
              {!loadingStaff && staffOptions.length > 1 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                    Elige profesional
                  </h2>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffSelection(ANY_STAFF)}
                      className={`text-left border rounded-xl p-3 bg-surface flex items-center gap-2 ${
                        staffSelection === ANY_STAFF
                          ? "border-brand ring-1 ring-brand"
                          : "border-border hover:border-brand/50"
                      }`}
                    >
                      <span aria-hidden className="w-3 h-3 rounded-full bg-brand shrink-0" />
                      <span className="font-medium">Cualquiera disponible</span>
                    </button>
                    {staffOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStaffSelection(opt.id)}
                        className={`text-left border rounded-xl p-3 bg-surface flex items-center gap-2 ${
                          staffSelection === opt.id
                            ? "border-brand ring-1 ring-brand"
                            : "border-border hover:border-brand/50"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="font-medium">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Fecha y hora */}
              <section>
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                  Elige fecha y hora
                </h2>
                <DateTimePicker
                  slug={slug}
                  serviceId={service.id}
                  staffSelection={staffSelection}
                  picked={picked}
                  onPick={(dateStr, time) => {
                    setPicked({ dateStr, time });
                    step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </section>

              {/* Datos y confirmación */}
              {picked && (
                <section ref={step3Ref} className="scroll-mt-4">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                    Tus datos
                  </h2>
                  <form action={formAction} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input type="hidden" name="staffId" value={staffSelection} />
                    <input type="hidden" name="date" value={picked.dateStr} />
                    <input type="hidden" name="time" value={picked.time} />
                    {serviceFields.length > 0 && (
                      <input
                        type="hidden"
                        name="customAnswers"
                        value={JSON.stringify(
                          serviceFields.map((f) => ({ label: f.label, value: customValues[f.id] ?? "" }))
                        )}
                      />
                    )}

                    <p className="text-sm bg-brand-soft rounded-lg px-3 py-2">
                      <span className="capitalize">{formatDateLong(picked.dateStr)}</span> a las{" "}
                      <strong>{picked.time}</strong> · {service.name}
                    </p>

                    {serviceFields.map((f) =>
                      f.type === "SELECT" ? (
                        <fieldset key={f.id} className="flex flex-col gap-1.5">
                          <legend className="text-sm font-medium mb-1">
                            {f.label}
                            {f.required && <span className="text-danger"> *</span>}
                          </legend>
                          <div className="flex flex-wrap gap-2">
                            {f.options.map((option) => (
                              <label
                                key={option}
                                className={`text-sm border rounded-lg px-3 py-1.5 cursor-pointer ${
                                  customValues[f.id] === option
                                    ? "border-brand ring-1 ring-brand bg-brand-soft"
                                    : "border-border hover:border-brand/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`_custom_${f.id}`}
                                  value={option}
                                  checked={customValues[f.id] === option}
                                  onChange={() => setCustomValues((v) => ({ ...v, [f.id]: option }))}
                                  className="sr-only"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ) : (
                        <div key={f.id} className="flex flex-col gap-1">
                          <label htmlFor={`custom-${f.id}`} className="text-sm font-medium">
                            {f.label}
                            {f.required && <span className="text-danger"> *</span>}
                          </label>
                          <input
                            id={`custom-${f.id}`}
                            type="text"
                            required={f.required}
                            value={customValues[f.id] ?? ""}
                            onChange={(e) => setCustomValues((v) => ({ ...v, [f.id]: e.target.value }))}
                            className="border border-border rounded-lg px-3 py-2.5 bg-surface"
                          />
                        </div>
                      )
                    )}

                    <div className="flex flex-col gap-1">
                      <label htmlFor="clientName" className="text-sm font-medium">Tu nombre *</label>
                      <input
                        id="clientName"
                        name="clientName"
                        type="text"
                        required
                        value={fields.name}
                        onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        aria-invalid={!!nameError}
                        aria-describedby={nameError ? "clientName-error" : undefined}
                        className={`border rounded-lg px-3 py-2.5 bg-surface ${nameError ? "border-danger" : "border-border"}`}
                      />
                      {nameError && (
                        <p id="clientName-error" role="alert" className="text-xs text-danger">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="clientPhone" className="text-sm font-medium">Tu teléfono *</label>
                      <input
                        id="clientPhone"
                        name="clientPhone"
                        type="tel"
                        required
                        placeholder="+56 9 1234 5678"
                        value={fields.phone}
                        onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                        aria-invalid={!!phoneError}
                        aria-describedby={phoneError ? "clientPhone-error" : undefined}
                        className={`border rounded-lg px-3 py-2.5 bg-surface ${phoneError ? "border-danger" : "border-border"}`}
                      />
                      {phoneError && (
                        <p id="clientPhone-error" role="alert" className="text-xs text-danger">
                          {phoneError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="clientEmail" className="text-sm font-medium">
                        Tu email <span className="text-muted font-normal">(para recibir confirmación y recordatorio)</span>
                      </label>
                      <input
                        id="clientEmail"
                        name="clientEmail"
                        type="email"
                        value={fields.email}
                        onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? "clientEmail-error" : undefined}
                        className={`border rounded-lg px-3 py-2.5 bg-surface ${emailError ? "border-danger" : "border-border"}`}
                      />
                      {emailError && (
                        <p id="clientEmail-error" role="alert" className="text-xs text-danger">
                          {emailError}
                        </p>
                      )}
                    </div>

                    {state.error && (
                      <p role="alert" className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
                        {state.error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isPending || !!nameError || !!phoneError || !!emailError}
                      className="bg-brand text-brand-foreground rounded-xl px-4 py-3.5 font-semibold shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      {isPending ? "Confirmando tu reserva…" : "Confirmar reserva"}
                    </button>
                  </form>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación después de la reserva */}
      {showConfirmation && picked && service && (
        <ConfirmationModal
          serviceName={service.name}
          dateStr={picked.dateStr}
          time={picked.time}
          onClose={handleConfirmationClose}
        />
      )}
    </div>
  );
}
