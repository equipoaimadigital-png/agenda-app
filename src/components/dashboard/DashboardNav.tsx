"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Agenda", icon: "📅" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👥" },
  { href: "/dashboard/campanas", label: "Campañas", icon: "📣" },
  { href: "/dashboard/servicios", label: "Servicios", icon: "📋" },
  { href: "/dashboard/disponibilidad", label: "Disponibilidad", icon: "🕘" },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: "📊" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: "⚙️" },
  { href: "/dashboard/suscripcion", label: "Suscripción", icon: "💳" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

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
