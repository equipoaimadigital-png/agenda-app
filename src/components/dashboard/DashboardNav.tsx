"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Industry } from "@prisma/client";
import { industryPreset } from "@/lib/industries";

export function DashboardNav({ industry }: { industry: Industry }) {
  const pathname = usePathname();
  const icons = industryPreset(industry).navIcons;

  const ITEMS = [
    { href: "/dashboard", label: "Agenda", icon: icons.agenda },
    { href: "/dashboard/servicios", label: "Servicios", icon: icons.servicios },
    { href: "/dashboard/disponibilidad", label: "Disponibilidad", icon: icons.disponibilidad },
    { href: "/dashboard/estadisticas", label: "Estadísticas", icon: icons.estadisticas },
    { href: "/dashboard/configuracion", label: "Configuración", icon: icons.configuracion },
  ] as const;

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto">
      {ITEMS.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
              active
                ? "bg-brand text-brand-foreground font-medium"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
