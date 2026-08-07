"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicBooking, type CreateBookingResult } from "@/lib/actions/bookings";
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

export function BookingWidget({ slug, services }: { slug: string; services: Service[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(
    services.length === 1 ? services[0].id : null
  );
  const [picked, setPicked] = useState<{ dateStr: string; time: string } | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});
  const [fields, setFields] = useState({ name: "", phone: "", email: "" });

  const service = services.find((s) => s.id === serviceId) ?? null;

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
                className={`text-left border rounded-xl p-4 bg-surface ${
                  selected ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/50"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted whitespace-nowrap">
                    {s.durationMin} min{s.price ? ` · ${formatPrice(s.price)}` : ""}
                  </p>
                </div>
                {s.description && (
                  <p className="text-sm text-muted mt-1">{s.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Paso 2: fecha y hora */}
      {service && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            2 · Elige fecha y hora
          </h2>
          <DateTimePicker
            slug={slug}
            serviceId={service.id}
            picked={picked}
            onPick={(dateStr, time) => setPicked({ dateStr, time })}
          />
        </section>
      )}

      {/* Paso 3: datos y confirmación */}
      {service && picked && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            3 · Tus datos
          </h2>
          <form action={formAction} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="serviceId" value={service.id} />
            <input type="hidden" name="date" value={picked.dateStr} />
            <input type="hidden" name="time" value={picked.time} />

            <p className="text-sm bg-brand-soft rounded-lg px-3 py-2">
              <span className="capitalize">{formatDateLong(picked.dateStr)}</span> a las{" "}
              <strong>{picked.time}</strong> · {service.name}
            </p>

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
