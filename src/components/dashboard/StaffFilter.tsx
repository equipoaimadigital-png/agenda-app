"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function StaffFilter({ staff }: { staff: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("staffId") ?? "";

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
      <option value="">Todos los profesionales</option>
      {staff.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
