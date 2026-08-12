import Link from "next/link";
import { formatDateShort, minutesToTime } from "@/lib/dates";

export type WeekBooking = {
  id: string;
  dateStr: string;
  startMinutes: number;
  durationMin: number;
  clientName: string;
  serviceName: string;
  status: string;
};

const STATUS_CLASSES: Record<string, string> = {
  CONFIRMED: "bg-brand text-brand-foreground",
  CANCELLED: "bg-border text-muted line-through",
  COMPLETED: "bg-success text-white",
  NO_SHOW: "bg-warning text-white",
};

const PIXELS_PER_HOUR = 56;

export function WeekView({
  weekDates,
  bookings,
  rangeStartMinutes,
  rangeEndMinutes,
  todayStr,
  baseHref,
}: {
  /** 7 fechas "YYYY-MM-DD", lunes a domingo */
  weekDates: string[];
  bookings: WeekBooking[];
  rangeStartMinutes: number;
  rangeEndMinutes: number;
  todayStr: string;
  /** Query params actuales (sin `week`), para armar los links de navegación */
  baseHref: (weekStart: string) => string;
}) {
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

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Link
          href={baseHref(weekDates[0])}
          className="text-sm border border-border rounded-lg px-2 py-1 hover:border-brand"
        >
          ← Semana anterior
        </Link>
        <p className="text-sm font-medium">
          {formatDateShort(weekDates[0])} – {formatDateShort(weekDates[6])}
        </p>
        <Link
          href={baseHref(weekDates[6])}
          className="text-sm border border-border rounded-lg px-2 py-1 hover:border-brand"
        >
          Semana siguiente →
        </Link>
      </div>

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
              className="relative border-l border-border"
              style={{ height: totalHeight }}
            >
              {hourMarks.map((m) => (
                <div
                  key={m}
                  className="absolute w-full border-t border-border/60"
                  style={{ top: ((m - rangeStartMinutes) / totalMinutes) * 100 + "%" }}
                />
              ))}
              {(byDate.get(d) ?? []).map((b) => {
                const top = ((b.startMinutes - rangeStartMinutes) / totalMinutes) * 100;
                const height = Math.max((b.durationMin / totalMinutes) * 100, 4);
                return (
                  <div
                    key={b.id}
                    className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-[11px] leading-tight overflow-hidden ${
                      STATUS_CLASSES[b.status] ?? STATUS_CLASSES.CONFIRMED
                    }`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={`${minutesToTime(b.startMinutes)} · ${b.clientName} · ${b.serviceName}`}
                  >
                    <span className="font-medium">{minutesToTime(b.startMinutes)}</span> {b.clientName}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
