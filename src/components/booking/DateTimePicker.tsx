"use client";

import { useCallback, useEffect, useState } from "react";
import { getAvailableSlots, getMonthAvailability } from "@/lib/actions/bookings";
import type { DaySuggestion, StaffSelection } from "@/lib/booking-logic";
import { formatDateLong, parseDateStr, toDateStr } from "@/lib/dates";

const WEEKDAY_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function todayStr(): string {
  const d = new Date();
  return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

type Props = {
  slug: string;
  serviceId: string;
  staffSelection: StaffSelection;
  onPick: (dateStr: string, time: string) => void;
  picked: { dateStr: string; time: string } | null;
};

export function DateTimePicker({ slug, serviceId, staffSelection, onPick, picked }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-12
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<DaySuggestion[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingMonth(true);
    // Cambiar de profesional invalida el día/hora ya elegidos
    setSelectedDate(null);
    setSlots([]);
    setSuggestions([]);
    getMonthAvailability(slug, serviceId, staffSelection, viewYear, viewMonth).then((dates) => {
      if (!cancelled) {
        setAvailableDates(new Set(dates));
        setLoadingMonth(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, staffSelection, viewYear, viewMonth]);

  const selectDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      setSlots([]);
      setSuggestions([]);
      setLoadingSlots(true);
      getAvailableSlots(slug, serviceId, staffSelection, dateStr).then((result) => {
        setSlots(result.slots);
        setSuggestions(result.suggestions);
        setLoadingSlots(false);
      });
    },
    [slug, serviceId, staffSelection]
  );

  function shiftMonth(delta: number) {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    // No retrocede antes del mes actual
    const min = todayStr();
    const { year: minY, month: minM } = parseDateStr(min);
    if (y < minY || (y === minY && m < minM)) return;
    setViewYear(y);
    setViewMonth(m);
  }

  // Construye la grilla del mes (semana empieza en lunes)
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=dom
  const leadingBlanks = (firstWeekday + 6) % 7; // lunes=0
  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const minDate = todayStr();

  return (
    <div className="flex flex-col gap-4">
      {/* Calendario */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
            className="w-8 h-8 rounded-lg border border-border bg-surface shadow-[0_2px_0_rgba(0,0,0,0.06),0_3px_8px_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-[1px] transition-all hover:bg-brand-soft"
          >
            ‹
          </button>
          <p className="font-semibold">
            {MONTHS_ES[viewMonth - 1]} {viewYear}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            className="w-8 h-8 rounded-lg border border-border bg-surface shadow-[0_2px_0_rgba(0,0,0,0.06),0_3px_8px_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-[1px] transition-all hover:bg-brand-soft"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-1">
          {WEEKDAY_HEADERS.map((h, i) => (
            <span key={i} className="py-1">{h}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={`b${i}`} />;
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const isPast = dateStr < minDate;
            const hasSlots = availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const disabled = isPast || (!hasSlots && !loadingMonth);
            return (
              <button
                key={dateStr}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(dateStr)}
                className={`h-9 rounded-lg text-sm transition-all ${
                  isSelected
                    ? "bg-brand text-brand-foreground font-semibold shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)]"
                    : hasSlots
                      ? "bg-brand-soft text-foreground font-semibold hover:opacity-80"
                      : "text-muted/50"
                } disabled:cursor-not-allowed`}
              >
                {day}
              </button>
            );
          })}
        </div>
        {loadingMonth && (
          <p className="text-xs text-muted mt-2">Cargando disponibilidad…</p>
        )}
      </div>

      {/* Horarios del día elegido */}
      {selectedDate && (
        <div aria-live="polite" aria-busy={loadingSlots}>
          <p className="text-sm font-semibold mb-2 capitalize">
            {formatDateLong(selectedDate)}
          </p>
          {loadingSlots ? (
            <div className="flex flex-wrap gap-2" aria-label="Buscando horarios disponibles">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="h-9 w-16 rounded-lg bg-border animate-pulse"
                />
              ))}
            </div>
          ) : slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot, i) => {
                const isPicked = picked?.dateStr === selectedDate && picked?.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onPick(selectedDate, slot)}
                    className={`border rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                      i < 6 ? "slot-in" : ""
                    } ${
                      isPicked
                        ? "bg-brand text-brand-foreground border-brand shadow-[0_2px_0_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.14)]"
                        : "border-border bg-surface hover:border-brand shadow-[0_2px_0_rgba(0,0,0,0.05),0_3px_8px_rgba(0,0,0,0.04)]"
                    }`}
                    style={i < 6 ? { animationDelay: `${i * 20}ms` } : undefined}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-warning-soft border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.05)]">
              <p className="text-sm font-medium">
                Ese día no quedan horarios. Los más cercanos disponibles son:
              </p>
              {suggestions.length === 0 && (
                <p className="text-sm text-muted">
                  No encontramos cupos en los próximos 30 días.
                </p>
              )}
              {suggestions.map((s) => (
                <div key={s.dateStr} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold capitalize w-full sm:w-auto">
                    {formatDateLong(s.dateStr)}:
                  </span>
                  {s.slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedDate(s.dateStr);
                        setSlots([]);
                        onPick(s.dateStr, slot);
                        selectDate(s.dateStr);
                      }}
                      className="border border-border bg-surface rounded-lg px-3 py-1.5 text-sm font-semibold hover:border-brand shadow-[0_2px_0_rgba(0,0,0,0.05),0_3px_8px_rgba(0,0,0,0.04)] transition-all"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
