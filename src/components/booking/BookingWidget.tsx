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
import { formatDateLong } from "@/lib/dates";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
};

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

export function BookingWidget({
  slug,
  services,
}: {
  slug: string;
  services: Service[];
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(
    services.length === 1 ? services[0].id : null
  );
  const [picked, setPicked] = useState<{ dateStr: string; time: string } | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});
  const [fields, setFields] = useState({ name: "", phone: "", email: "" });

  const [staffOptions, setStaffOptions] = useState<StaffOptionView[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSelection, setStaffSelection] = useState<StaffSelection>(ANY_STAFF);

  const [serviceFields, setServiceFields] = useState<ServiceFieldView[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const service = services.find((s) => s.id === serviceId) ?? null;

  // En mobile, el paso 2 aparece debajo del pliegue: si no hacemos scroll
  // hasta él, se siente como si el clic en el servicio "no hiciera nada".
  const step2Ref = useRef<HTMLElement>(null);
  const step3Ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (service) {
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [service]);

  // Al elegir servicio, carga qué profesionales pueden realizarlo
  useEffect(() => {
    if (!service) {
      setStaffOptions([]);
      setStaffSelection(ANY_STAFF);
      return;
    }
    let cancelled = false;
    setLoadingStaff(true);
    setStaffSelection(ANY_STAFF);
    setPicked(null);
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
    if (!service) {
      setServiceFields([]);
      setCustomValues({});
      return;
    }
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
      if (result.success && result.manageToken) {
        const wa = result.whatsappLink ? `&wa=${encodeURIComponent(result.whatsappLink)}` : "";
        router.push(`/reserva/${result.manageToken}?nueva=1${wa}`);
      }
      return result;
    },
    {}
  );

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
        <div className="grid gap-2">
          {services.map((s) => {
            const selected = s.id === serviceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setPicked(null);
                }}
                className={`w-full flex items-center justify-between gap-3 border rounded-xl p-4 bg-surface text-left cursor-pointer transition-colors ${
                  selected ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted whitespace-nowrap">
                    {s.durationMin} min{s.price ? ` · ${formatPrice(s.price)}` : ""}
                  </p>
                  {s.description && (
                    <p className="text-sm text-muted mt-1">{s.description}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
                    selected
                      ? "bg-brand text-brand-foreground"
                      : "border border-border"
                  }`}
                >
                  {selected ? "✓ Elegido" : "Agendar"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Paso 2 (si hay más de un profesional para el servicio elegido) */}
      {service && !loadingStaff && staffOptions.length > 1 && (
        <section className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            2 · Elige profesional
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
      {service && (
        <section ref={step2Ref} className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {staffOptions.length > 1 ? "3" : "2"} · Elige fecha y hora
          </h2>
          <DateTimePicker
            slug={slug}
            serviceId={service.id}
            staffSelection={staffSelection}
            picked={picked}
            onPick={(dateStr, time) => setPicked({ dateStr, time })}
          />
        </section>
      )}

      {/* Datos y confirmación */}
      {service && picked && (
        <section ref={step3Ref} className="scroll-mt-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {staffOptions.length > 1 ? "4" : "3"} · Tus datos
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
                className={`border rounded-lg px-3 py-2.5 bg-surface ${nameError ? "border-danger" : "border-border"}`}
              />
              {nameError && <p className="text-xs text-danger">{nameError}</p>}
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
                className={`border rounded-lg px-3 py-2.5 bg-surface ${phoneError ? "border-danger" : "border-border"}`}
              />
              {phoneError && <p className="text-xs text-danger">{phoneError}</p>}
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
                className={`border rounded-lg px-3 py-2.5 bg-surface ${emailError ? "border-danger" : "border-border"}`}
              />
              {emailError && <p className="text-xs text-danger">{emailError}</p>}
            </div>

            {state.error && (
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending || !!nameError || !!phoneError || !!emailError}
              className="bg-brand text-brand-foreground rounded-lg px-4 py-3 font-medium disabled:opacity-50"
            >
              {isPending ? "Confirmando tu reserva…" : "Confirmar reserva"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
