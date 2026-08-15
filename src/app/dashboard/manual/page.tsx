import Link from "next/link";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import {
  IconBook,
  IconCalendar,
  IconCard,
  IconChart,
  IconClipboard,
  IconClock,
  IconGear,
  IconHelp,
  IconMegaphone,
  IconUsers,
} from "@/components/dashboard/ManualIcons";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Section = {
  title: string;
  icon: IconComponent;
  intro: string;
  items: { label: string; body: string }[];
};

const SECTIONS: Section[] = [
  {
    title: "Agenda",
    icon: IconCalendar,
    intro: "Tu día a día: ver, crear y gestionar citas.",
    items: [
      {
        label: "Ver tus citas",
        body:
          'La página principal del panel. Vista "Lista" muestra tus citas de los últimos 7 días y las próximas; vista "Semana" muestra un calendario semanal. Puedes filtrar por profesional si tienes más de uno.',
      },
      {
        label: "Crear una reserva manual",
        body:
          'Usa el botón "Nueva reserva" arriba de la Agenda para agendar a un cliente que te escribió por fuera de la app (WhatsApp, teléfono, etc.). Queda marcada como "Manual" en Estadísticas.',
      },
      {
        label: "Marcar atendida / no llegó",
        body:
          "En cada cita pasada puedes marcarla como Completada o No llegó, para llevar un registro de asistencia.",
      },
      {
        label: "Cancelar un día completo",
        body:
          'Si tienes una emergencia, usa "Cancelar día" para cancelar todas las citas confirmadas de esa fecha de una vez — se les avisa por email a todos los clientes afectados.',
      },
    ],
  },
  {
    title: "Clientes",
    icon: IconUsers,
    intro: "Se arma sola con cada reserva — sin cargar nada a mano.",
    items: [
      {
        label: "Base de clientes",
        body:
          "Lista de todas las personas que han reservado contigo, con su historial de visitas. Se arma sola a medida que llegan reservas — no hay que cargar nada a mano.",
      },
      {
        label: "Cumpleaños",
        body:
          "Si guardas la fecha de cumpleaños de un cliente, aparece un aviso en la Agenda el día que corresponda.",
      },
    ],
  },
  {
    title: "Campañas",
    icon: IconMegaphone,
    intro: "Reactiva clientes y avisa novedades por email.",
    items: [
      {
        label: "Enviar un email a tus clientes",
        body:
          'Elige una plantilla (reactivación, promoción, nuevo servicio, etc.), edítala si quieres, y elige a quién le llega: todos tus clientes o solo los inactivos hace 30+ días. Cada email incluye un botón para reservar y un link de desuscripción obligatorio.',
      },
    ],
  },
  {
    title: "Servicios",
    icon: IconClipboard,
    intro: "Lo que tus clientes pueden reservar, con precio a tu medida.",
    items: [
      {
        label: "Crear un servicio",
        body:
          "Nombre, descripción, duración y precio. El precio puede ser fijo, \"Desde $X\" (para servicios cuyo costo final varía) o \"A cotizar\" (sin precio público — ideal para asesorías, estudios jurídicos, etc.).",
      },
      {
        label: "Pausar o eliminar",
        body:
          'Un servicio "Pausado" no aparece en tu página pública pero conserva su historial. Si el servicio ya tiene reservas, "Eliminar" lo pausa en vez de borrarlo, para no perder el historial de esas citas.',
      },
      {
        label: "Preguntas personalizadas",
        body:
          "Puedes agregar preguntas que el cliente responde al reservar ese servicio (texto libre o opción múltiple), útil para pedir información previa a la cita.",
      },
    ],
  },
  {
    title: "Disponibilidad",
    icon: IconClock,
    intro: "Cuándo atiendes — y cuándo no.",
    items: [
      {
        label: "Horario semanal",
        body:
          "Define los bloques de horario en que atiendes cada día de la semana. Las citas solo se pueden reservar dentro de esos bloques.",
      },
      {
        label: "Días bloqueados",
        body:
          "Marca fechas puntuales (feriados, vacaciones) en que no atiendes, sin tener que tocar tu horario semanal.",
      },
    ],
  },
  {
    title: "Estadísticas",
    icon: IconChart,
    intro: "Cómo le está yendo a tu negocio, de un vistazo.",
    items: [
      {
        label: "Qué muestra",
        body:
          "Ingresos estimados, ocupación por día de la semana, origen de las reservas (online vs. manual) y métricas de recordatorios enviados.",
      },
    ],
  },
  {
    title: "Configuración",
    icon: IconGear,
    intro: "Cómo se ve y se presenta tu negocio hacia afuera.",
    items: [
      {
        label: "Imagen de portada",
        body:
          'Haz clic en el recuadro punteado para elegir una foto desde tu computador, luego presiona "Guardar foto". Aparece como fondo en la parte superior de tu página de reservas.',
      },
      {
        label: "Nombre, descripción y datos de contacto",
        body:
          'El nombre y la descripción se muestran en tu página pública. Recuerda presionar "Guardar cambios" al final del formulario para que se apliquen.',
      },
      {
        label: "Estilo del nombre y la descripción",
        body:
          "Elige entre 4 combinaciones de tipografía (Clásico, Editorial, Moderno, Cercano) y 3 tamaños. La vista previa en negro muestra cómo se va a ver antes de guardar.",
      },
      {
        label: "Color de marca",
        body: "Define el color de acento que se usa en botones y detalles de tu página pública.",
      },
      {
        label: "Instagram y Facebook",
        body:
          "Pega el link completo a tu perfil (con https://) y se muestra como botón en tu página pública, junto a WhatsApp y Google Maps.",
      },
      {
        label: "Política de cancelación",
        body: "Define con cuántas horas de anticipación un cliente puede cancelar o reprogramar su cita.",
      },
    ],
  },
  {
    title: "Suscripción",
    icon: IconCard,
    intro: "Tu prueba gratis y el cobro mensual.",
    items: [
      {
        label: "Prueba gratis y cobro",
        body:
          "Tienes 14 días de prueba gratis. Después, la suscripción se cobra automáticamente cada mes a través de Mercado Pago. Puedes cancelarla desde tu cuenta de Mercado Pago cuando quieras.",
      },
    ],
  },
];

const FAQ = [
  {
    q: "Cambié el nombre del negocio y no se ve en mi página pública, ¿qué hago?",
    a: 'Revisa que hayas presionado "Guardar cambios" al final del formulario en Configuración — es un botón separado del de la foto de portada. Si ya lo guardaste y sigue sin verse, espera unos minutos y recarga la página con Ctrl+F5 (o Cmd+Shift+R en Mac) para forzar que se actualice.',
  },
  {
    q: "Un cliente no puede elegir un servicio en mi página de reservas",
    a: 'Toca en cualquier parte de la tarjeta del servicio (no solo el botón "Agendar") — debería seleccionarse y avanzar al paso siguiente. Si el problema persiste, revisa que el servicio esté "Activo" (no pausado) en la sección Servicios.',
  },
  {
    q: "¿Cómo comparto mi página de reservas?",
    a: 'El link está siempre visible arriba del menú del panel ("Tu página de reservas"), con un botón "Copiar link". Compártelo por WhatsApp, redes sociales o donde prefieras.',
  },
  {
    q: "¿Puedo tener más de un profesional atendiendo?",
    a: "Sí, la app soporta múltiples profesionales (staff) por negocio, cada uno con su propia disponibilidad. La gestión completa de staff desde el panel está en desarrollo — mientras tanto, contáctanos si necesitas agregar uno.",
  },
];

function slug(title: string): string {
  return title.toLowerCase();
}

export default async function ManualPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-ink text-white px-6 py-10 sm:px-10 sm:py-12">
        <div aria-hidden className="absolute inset-0 seal-texture" />
        <div className="relative flex items-start gap-4">
          <div
            aria-hidden
            className="hidden sm:flex w-14 h-14 shrink-0 rounded-2xl bg-brand items-center justify-center ring-2 ring-white/15"
          >
            <IconBook className="w-7 h-7 text-brand-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Manual de uso</p>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">
              Todo lo que puedes hacer en Tu Hora Lista
            </h1>
            <p className="text-white/70 mt-3 max-w-lg text-sm sm:text-base">
              Guía rápida por secciones, pensada para volver cuando la necesites — no hace
              falta leerla toda de una vez.
            </p>
          </div>
        </div>
      </div>

      {/* Navegación por temas */}
      <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.title}
              href={`#${slug(s.title)}`}
              className="group flex items-start gap-3 bg-surface border border-border rounded-xl p-3.5 hover:border-brand hover:shadow-sm transition-all"
            >
              <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                <Icon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-sm">{s.title}</span>
                <span className="block text-xs text-muted mt-0.5 line-clamp-2">{s.intro}</span>
              </span>
            </a>
          );
        })}
        <a
          href="#faq"
          className="group flex items-start gap-3 bg-surface border border-border rounded-xl p-3.5 hover:border-brand hover:shadow-sm transition-all"
        >
          <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
            <IconHelp className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-sm">Preguntas frecuentes</span>
            <span className="block text-xs text-muted mt-0.5">Las dudas más comunes.</span>
          </span>
        </a>
      </nav>

      {/* Secciones */}
      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} id={slug(section.title)} className="scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-semibold font-display text-lg leading-tight">
                    {section.title}
                  </h2>
                  <p className="text-xs text-muted">{section.intro}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5 sm:pl-[3.25rem]">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface border border-border border-l-[3px] border-l-brass rounded-xl p-4"
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-sm text-muted mt-1">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <IconHelp className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-semibold font-display text-lg leading-tight">
              Preguntas frecuentes
            </h2>
            <p className="text-xs text-muted">Lo que más preguntan otros negocios.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:pl-[3.25rem]">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group bg-surface border border-border rounded-xl p-4 open:border-brand"
            >
              <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                {f.q}
                <span
                  aria-hidden
                  className="shrink-0 text-muted group-open:rotate-180 transition-transform"
                >
                  ⌄
                </span>
              </summary>
              <p className="text-sm text-muted mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted border-t border-border pt-6">
        ¿Tienes otra duda?{" "}
        <Link href={`/reservar/${professional.slug}`} target="_blank" className="underline">
          Revisa tu página pública
        </Link>{" "}
        o{" "}
        <Link href="/dashboard/soporte" className="underline">
          contáctanos directamente
        </Link>
        .
      </p>
    </div>
  );
}
