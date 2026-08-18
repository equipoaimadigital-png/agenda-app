"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function StaffFilter({
  staff,
  allowAll = true,
}: {
  staff: { id: string; name: string }[];
  /** false cuando la pantalla siempre opera sobre UN profesional (ej. Disponibilidad) */
  allowAll?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("staffId") ?? (allowAll ? "" : staff[0]?.id ?? "");

  if (staff.length <= 1) return null;

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("staffId", e.target.value);
        else params.delete("staffId");
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
    >
      {allowAll && <option value="">Todos los profesionales</option>}
      {staff.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
