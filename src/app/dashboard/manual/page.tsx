import Link from "next/link";
import { getCurrentProfessional } from "@/lib/auth-helpers";

type Section = {
  title: string;
  icon: string;
  items: { label: string; body: string }[];
};

const SECTIONS: Section[] = [
  {
    title: "Agenda",
    icon: "📅",
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
    icon: "👥",
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
    icon: "📣",
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
    icon: "📋",
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
    icon: "🕘",
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
    icon: "📊",
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
    icon: "⚙️",
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
    icon: "💳",
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

export default async function ManualPage() {
  const professional = await getCurrentProfessional();
  if (!professional) return null;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Manual de uso</h1>
        <p className="text-sm text-muted mt-1">
          Guía rápida de todo lo que puedes hacer en tu panel de Tú Agenda.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.title}
            href={`#${s.title.toLowerCase()}`}
            className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand"
          >
            {s.icon} {s.title}
          </a>
        ))}
        <a
          href="#faq"
          className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand"
        >
          ❓ Preguntas frecuentes
        </a>
      </nav>

      {SECTIONS.map((section) => (
        <section key={section.title} id={section.title.toLowerCase()} className="scroll-mt-4">
          <h2 className="font-semibold font-display text-lg mb-3">
            {section.icon} {section.title}
          </h2>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => (
              <div
                key={item.label}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-sm text-muted mt-1">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section id="faq" className="scroll-mt-4">
        <h2 className="font-semibold font-display text-lg mb-3">❓ Preguntas frecuentes</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((f) => (
            <details key={f.q} className="bg-surface border border-border rounded-xl p-4">
              <summary className="font-medium text-sm cursor-pointer">{f.q}</summary>
              <p className="text-sm text-muted mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        ¿Tienes otra duda?{" "}
        <Link href={`/reservar/${professional.slug}`} target="_blank" className="underline">
          Revisa tu página pública
        </Link>{" "}
        o contáctanos directamente.
      </p>
    </div>
  );
}
