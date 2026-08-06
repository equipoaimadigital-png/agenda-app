import Link from "next/link";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const professional = await getCurrentProfessional();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r p-4 flex flex-col gap-4">
        <div>
          <p className="font-semibold">{professional?.businessName ?? "Mi negocio"}</p>
          {professional && (
            <p className="text-xs text-gray-500 break-all">/reservar/{professional.slug}</p>
          )}
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Citas
          </Link>
          <Link href="/dashboard/servicios" className="hover:underline">
            Servicios
          </Link>
          <Link href="/dashboard/disponibilidad" className="hover:underline">
            Disponibilidad
          </Link>
        </nav>
        <form action={signOut} className="mt-auto">
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
