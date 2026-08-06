"use client";

import { useActionState, useEffect, useState } from "react";
import { getAvailableSlots, createPublicBooking } from "@/lib/actions/bookings";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number | null;
};

type State = { error?: string; success?: boolean; whatsappLink?: string };

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function BookingWidget({ slug, services }: { slug: string; services: Service[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setTime(null);
    getAvailableSlots(slug, serviceId, date).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setLoadingSlots(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, date]);

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prevState, formData) => createPublicBooking(formData),
    {}
  );

  if (state.success) {
    return (
      <div className="border rounded-md p-4 bg-green-50 text-green-800 flex flex-col gap-3">
        <div>
          <p className="font-medium">¡Reserva confirmada!</p>
          <p className="text-sm">Te esperamos. Guarda esta confirmación.</p>
        </div>
        {state.whatsappLink && (
          <a
            href={state.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white rounded-md px-4 py-2 font-medium text-center"
          >
            Enviar confirmación por WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Servicio</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMin} min{s.price ? ` · $${s.price}` : ""})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Fecha</label>
        <input
          type="date"
          min={todayStr()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-md px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Horario</label>
        {loadingSlots ? (
          <p className="text-sm text-gray-500">Buscando horarios...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-500">No hay horarios disponibles ese día.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`border rounded-md px-3 py-1.5 text-sm ${
                  time === slot ? "bg-black text-white" : ""
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {time && (
        <form action={formAction} className="flex flex-col gap-3 border-t pt-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />

          <div className="flex flex-col gap-1">
            <label htmlFor="clientName" className="text-sm font-medium">
              Tu nombre
            </label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              required
              className="border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="clientPhone" className="text-sm font-medium">
              Tu teléfono
            </label>
            <input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              required
              className="border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="clientEmail" className="text-sm font-medium">
              Tu email (opcional)
            </label>
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              className="border rounded-md px-3 py-2"
            />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
          >
            {isPending ? "Reservando..." : "Reservar"}
          </button>
        </form>
      )}
    </div>
  );
}
