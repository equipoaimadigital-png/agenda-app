import Link from "next/link";
import { prisma } from "@/lib/db";
import { dismissOnboarding } from "@/lib/actions/dashboard";

type Props = {
  professionalId: string;
  slug: string;
  phone: string | null;
  description: string | null;
  coverImageUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  onboardingDismissed: boolean;
};

export async function OnboardingChecklist({
  professionalId,
  slug,
  phone,
  description,
  coverImageUrl,
  instagramUrl,
  facebookUrl,
  onboardingDismissed,
}: Props) {
  if (onboardingDismissed) return null;

  const [serviceCount, availabilityCount, bookingCount] = await Promise.all([
    prisma.service.count({ where: { professionalId } }),
    prisma.availability.count({ where: { staff: { professionalId } } }),
    prisma.booking.count({ where: { professionalId } }),
  ]);

  const tasks = [
    {
      label: "Configura tu primer servicio",
      done: serviceCount > 0,
      href: "/dashboard/servicios",
    },
    {
      label: "Configura tu disponibilidad",
      done: availabilityCount > 0,
      href: "/dashboard/disponibilidad",
    },
    {
      label: "Personaliza tu página (foto y descripción)",
      done: !!coverImageUrl || !!description,
      href: "/dashboard/configuracion",
    },
    {
      label: "Comparte tu link y recibe tu primera reserva",
      done: bookingCount > 0,
      href: `/reservar/${slug}`,
      external: true,
    },
    {
      label: "Agrega WhatsApp o tus redes sociales",
      done: !!phone || !!instagramUrl || !!facebookUrl,
      href: "/dashboard/configuracion",
    },
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  if (doneCount === tasks.length) return null;

  return (
    <section className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-stone uppercase tracking-wide">
            Primeros pasos · {doneCount}/{tasks.length}
          </p>
          <p className="font-semibold font-display text-lg">Deja tu agenda lista para recibir clientes</p>
        </div>
        <form action={dismissOnboarding}>
          <button
            type="submit"
            aria-label="Cerrar primeros pasos"
            className="text-muted hover:text-ink text-lg leading-none px-1"
          >
            ×
          </button>
        </form>
      </div>

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li
            key={task.label}
            className="flex items-center justify-between gap-3 bg-paper rounded-lg px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-xs shrink-0 ${
                  task.done ? "bg-success text-white" : "border border-border-strong"
                }`}
              >
                {task.done ? "✓" : ""}
              </span>
              <span className={task.done ? "text-muted line-through" : ""}>{task.label}</span>
            </span>
            {!task.done && (
              <Link
                href={task.href}
                target={task.external ? "_blank" : undefined}
                rel={task.external ? "noopener noreferrer" : undefined}
                className="shrink-0 text-xs font-medium border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
              >
                Iniciar
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
