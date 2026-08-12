"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateShort, minutesToTime } from "@/lib/dates";
import { cancelBookingByProfessional, markBookingStatus } from "@/lib/actions/dashboard";
import { createManualBooking } from "@/lib/actions/bookings";

export type WeekBooking = {
  id: string;
  dateStr: string;
  startMinutes: number;
  durationMin: number;
  clientName: string;
  serviceName: string;
  status: string;
};

type Service = { id: string; name: string; durationMin: number };
type StaffOption = { id: string; name: string };

const STATUS_CLASSES: Record<string, string> = {
  CONFIRMED: "bg-brand text-brand-foreground",
  CANCELLED: "bg-border text-muted line-through",
  COMPLETED: "bg-success text-white",
  NO_SHOW: "bg-warning text-white",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

const PIXELS_PER_HOUR = 56;

export function WeekView({
  weekDates,
  bookings,
  rangeStartMinutes,
  rangeEndMinutes,
  todayStr,
  baseHref,
  services,
  staff,
}: {
  /** 7 fechas "YYYY-MM-DD", lunes a domingo */
  weekDates: string[];
  bookings: WeekBooking[];
  rangeStartMinutes: number;
  rangeEndMinutes: number;
  todayStr: string;
  /** Query params actuales (sin `week`), para armar los links de navegación */
  baseHref: (weekStart: string) => string;
  services: Service[];
  staff: StaffOption[];
}) {
  const router = useRouter();
  const [activeBooking, setActiveBooking] = useState<WeekBooking | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ dateStr: string; time: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMinutes = rangeEndMinutes - rangeStartMinutes;
  const totalHeight = (totalMinutes / 60) * PIXELS_PER_HOUR;
  const hourMarks: number[] = [];
  for (let m = Math.ceil(rangeStartMinutes / 60) * 60; m <= rangeEndMinutes; m += 60) {
    hourMarks.push(m);
  }

  const byDate = new Map<string, WeekBooking[]>();
  for (const b of bookings) {
    const list = byDate.get(b.dateStr) ?? [];
    list.push(b);
    byDate.set(b.dateStr, list);
  }

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, dateStr: string) {
    if (services.length === 0 || staff.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    const raw = rangeStartMinutes + fraction * totalMinutes;
    const rounded = Math.min(rangeEndMinutes, Math.max(rangeStartMinutes, Math.round(raw / 30) * 30));
    setError(null);
    setQuickAdd({ dateStr, time: minutesToTime(rounded) });
  }

  async function handleCancel() {
    if (!activeBooking) return;
    setPending(true);
    await cancelBookingByProfessional(activeBooking.id, "");
    setPending(false);
    setActiveBooking(null);
    router.refresh();
  }

  async function handleStatus(status: "COMPLETED" | "NO_SHOW") {
    if (!activeBooking) return;
    setPending(true);
    await markBookingStatus(activeBooking.id, status);
    setPending(false);
    setActiveBooking(null);
    router.refresh();
  }

  async function handleQuickAddSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createManualBooking(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setQuickAdd(null);
    router.refresh();
  }

  const prevWeekStart = addDaysStr(weekDates[0], -1);
  const nextWeekStart = addDaysStr(weekDates[6], 1);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Link
          href={baseHref(prevWeekStart)}
          className="text-sm border border-border rounded-lg px-2 py-1 hover:border-brand"
        >
          ← Semana anterior
        </Link>
        <p className="text-sm font-medium">
          {formatDateShort(weekDates[0])} – {formatDateShort(weekDates[6])}
        </p>
        <Link
          href={baseHref(nextWeekStart)}
          className="text-sm border border-border rounded-lg px-2 py-1 hover:border-brand"
        >
          Semana siguiente →
        </Link>
      </div>

      {(services.length === 0 || staff.length === 0) && (
        <p className="text-xs text-muted px-3 pt-2">
          Agrega al menos un servicio y un profesional para poder reservar desde acá.
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[56px_repeat(7,minmax(110px,1fr))] min-w-[700px]">
          <div />
          {weekDates.map((d) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-2 border-l border-border ${
                d === todayStr ? "bg-brand-soft text-brand" : "text-stone"
              }`}
            >
              {formatDateShort(d)}
            </div>
          ))}

          <div className="relative" style={{ height: totalHeight }}>
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute right-1 text-[11px] text-muted -translate-y-1/2"
                style={{ top: ((m - rangeStartMinutes) / totalMinutes) * 100 + "%" }}
              >
                {minutesToTime(m)}
              </div>
            ))}
          </div>

          {weekDates.map((d) => (
            <div
              key={d}
              className="relative border-l border-border cursor-pointer"
              style={{ height: totalHeight }}
              onClick={(e) => handleColumnClick(e, d)}
            >
              {hourMarks.map((m) => (
                <div
                  key={m}
                  className="absolute w-full border-t border-border/60 pointer-events-none"
                  style={{ top: ((m - rangeStartMinutes) / totalMinutes) * 100 + "%" }}
                />
              ))}
              {(byDate.get(d) ?? []).map((b) => {
                const top = ((b.startMinutes - rangeStartMinutes) / totalMinutes) * 100;
                const height = Math.max((b.durationMin / totalMinutes) * 100, 4);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBooking(b);
                    }}
                    className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[11px] leading-tight overflow-hidden text-left cursor-pointer hover:opacity-90 ${
                      STATUS_CLASSES[b.status] ?? STATUS_CLASSES.CONFIRMED
                    }`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={`${minutesToTime(b.startMinutes)} · ${b.clientName} · ${b.serviceName}`}
                  >
                    <span className="font-medium">{minutesToTime(b.startMinutes)}</span> {b.clientName}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {activeBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveBooking(null)}
        >
          <div
            className="bg-surface rounded-xl p-4 max-w-sm w-full flex flex-col gap-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{activeBooking.clientName}</p>
              <span
                className={`text-xs rounded-full px-2 py-1 whitespace-nowrap ${
                  STATUS_CLASSES[activeBooking.status] ?? STATUS_CLASSES.CONFIRMED
                }`}
              >
                {STATUS_LABEL[activeBooking.status] ?? activeBooking.status}
              </span>
            </div>
            <p className="text-sm text-stone">
              {activeBooking.serviceName} · {minutesToTime(activeBooking.startMinutes)} ·{" "}
              {formatDateShort(activeBooking.dateStr)}
            </p>

            {activeBooking.status === "CONFIRMED" && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleCancel}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm text-danger hover:border-danger disabled:opacity-50"
                >
                  Cancelar cita
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatus("COMPLETED")}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm hover:border-success disabled:opacity-50"
                >
                  ✓ Atendida
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatus("NO_SHOW")}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm hover:border-warning disabled:opacity-50"
                >
                  No asistió
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveBooking(null)}
              className="text-sm text-stone self-start"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {quickAdd && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setQuickAdd(null)}
        >
          <form
            action={handleQuickAddSubmit}
            className="bg-surface rounded-xl p-4 max-w-sm w-full flex flex-col gap-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-medium">
              Nueva reserva — {formatDateShort(quickAdd.dateStr)}
            </p>
            <input type="hidden" name="date" value={quickAdd.dateStr} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="qa-time" className="text-sm font-medium">Hora *</label>
                <input
                  id="qa-time"
                  name="time"
                  type="time"
                  defaultValue={quickAdd.time}
                  required
                  className="border border-border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="qa-staffId" className="text-sm font-medium">Profesional *</label>
                <select
                  id="qa-staffId"
                  name="staffId"
                  required
                  className="border border-border rounded-lg px-3 py-2 bg-surface"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="qa-serviceId" className="text-sm font-medium">Servicio *</label>
              <select
                id="qa-serviceId"
                name="serviceId"
                required
                className="border border-border rounded-lg px-3 py-2 bg-surface"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMin} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="qa-clientName" className="text-sm font-medium">Nombre del cliente *</label>
              <input
                id="qa-clientName"
                name="clientName"
                type="text"
                required
                className="border border-border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="qa-clientPhone" className="text-sm font-medium">Teléfono *</label>
              <input
                id="qa-clientPhone"
                name="clientPhone"
                type="tel"
                required
                placeholder="+56 9 1234 5678"
                className="border border-border rounded-lg px-3 py-2"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Guardando…" : "Guardar reserva"}
              </button>
              <button
                type="button"
                onClick={() => setQuickAdd(null)}
                className="border border-border rounded-lg px-4 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
