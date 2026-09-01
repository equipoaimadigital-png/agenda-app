import type { ComponentType, SVGProps } from "react";
import {
  IconCalendar,
  IconCard,
  IconChart,
  IconClipboard,
  IconClock,
  IconGear,
  IconMegaphone,
  IconRefresh,
  IconUserCircle,
  IconUsers,
  IconWallet,
} from "@/components/dashboard/ManualIcons";
import { SUBSCRIPTION_PRICE_CLP, TRIAL_DAYS } from "@/lib/subscription";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type ManualItem = {
  label: string;
  body: string;
  /** Pasos numerados opcionales, para explicar un flujo concreto de principio a fin. */
  steps?: string[];
  /** Etiqueta corta ("Nuevo", etc.) que se muestra junto al título del item. */
  badge?: string;
};

export type Section = {
  title: string;
  icon: IconComponent;
  intro: string;
  badge?: string;
  items: ManualItem[];
};

/** Precio mensual, tomado de una sola fuente de verdad para que el manual
 *  nunca quede desfasado del cobro real. */
const PRICE = `$${SUBSCRIPTION_PRICE_CLP.toLocaleString("es-CL")}`;

export const SECTIONS: Section[] = [
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
    intro: "Reactiva clientes y avisa novedades por email, con la marca de tu negocio.",
    items: [
      {
        label: "Enviar un email a tus clientes",
        body:
          'Elige una plantilla (reactivación, promoción, nuevo servicio, etc.), edítala si quieres, y elige a quién le llega: todos tus clientes o solo los inactivos hace 30+ días. Cada email incluye un botón para reservar y un link de desuscripción obligatorio.',
      },
      {
        label: "El correo lleva tu marca",
        badge: "Nuevo",
        body:
          'El correo sale con tu imagen de portada arriba, tu color de marca en el botón "Reservar ahora" y tus redes (Instagram, Facebook, WhatsApp, Cómo llegar) — todo se toma de Configuración. Con el interruptor "Incluir mi imagen de portada" decides si va con foto o solo con la banda de color. Si subes un GIF como portada, el correo se anima.',
      },
      {
        label: "Sugerencias para ti",
        badge: "Nuevo",
        body:
          'Arriba del editor aparecen recetas de campaña según cómo se comportan tus clientes: "Recuperar primeras visitas", "Reactivar habituales que se enfriaron", "Llenar el día más flojo" y "Saludo de cumpleaños del mes". Cada una trae el texto listo y va dirigida solo a los clientes que corresponden — la editas y la envías desde ahí mismo.',
      },
      {
        label: "Probar antes de enviar",
        body:
          'El botón "Enviarme una prueba" te manda el correo a tu propio email, tal como le llegaría a un cliente, sin tocar a nadie de tu lista.',
      },
    ],
  },
  {
    title: "Reactivación",
    icon: IconRefresh,
    intro: "Detecta a qué clientes empujar según el ritmo de cada uno — sin que tengas que revisarlo.",
    badge: "Nuevo",
    items: [
      {
        label: "Qué hace",
        body:
          "Por cada cliente calcula cada cuánto suele venir (su ritmo) y marca a los que llevan bastante más tiempo del habitual sin aparecer. Los ordena de más atrasado a menos. En el inicio del panel ves una tarjeta \"N clientes para reactivar\".",
      },
      {
        label: "A quién NO incluye",
        body:
          "A quien ya tiene una hora agendada, a quien se desuscribió de tus correos, y a quien recibió una campaña tuya hace menos de 14 días (para no saturarlo).",
      },
      {
        label: "Escribirles",
        body:
          'Dentro de Reactivación hay un compositor de campaña dirigido solo a los atrasados, con un texto de invitación listo. Puedes incluir también a los que "están por atrasarse". Al enviar, esos clientes no vuelven a aparecer aquí por 14 días.',
      },
      {
        label: "\"Todavía estamos juntando datos\"",
        body:
          "Si tu negocio tiene menos de 30 días de historial o menos de 10 clientes con visitas, la sección muestra ese mensaje en vez de números pobres. Se activa sola cuando hay suficiente información.",
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
          'Nombre, descripción, duración y precio. El precio puede ser fijo, "Desde $X" (para servicios cuyo costo final varía) o "A cotizar" (sin precio público — ideal para asesorías, estudios jurídicos, etc.).',
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
      {
        label: "Pedir un depósito al reservar",
        badge: "Nuevo",
        body:
          'Si conectaste tu cuenta de Mercado Pago (Configuración → "Cobro de depósitos"), cada servicio puede pedir un adelanto: opcional (el cliente elige) u obligatorio. Se configura al editar el servicio. Revisa la sección "Cobro de depósitos" de este manual para el detalle.',
      },
    ],
  },
  {
    title: "Cobro de depósitos",
    icon: IconWallet,
    intro:
      "Pide un adelanto al reservar para reducir las inasistencias. El dinero llega directo a tu cuenta de Mercado Pago — nunca pasa por Tu Hora Lista.",
    badge: "Nuevo",
    items: [
      {
        label: "Conectar tu cuenta de Mercado Pago",
        badge: "Nuevo",
        body:
          "Antes de poder cobrar un adelanto tienes que conectar tu propia cuenta de Mercado Pago. Los depósitos llegan directo a esa cuenta. Si no tienes cuenta de Mercado Pago, puedes crearla gratis en el mismo momento.",
        steps: [
          "Abre Configuración en el menú del panel.",
          'En la tarjeta "Cobro de depósitos", haz clic en "Conectar con Mercado Pago".',
          "Inicia sesión en TU cuenta de Mercado Pago (o créala ahí mismo, es gratis).",
          'Autoriza el acceso. Vuelves solo al panel y verás el aviso "Cuenta conectada".',
          "Ya puedes ponerle un monto de depósito a los servicios que quieras, en la sección Servicios.",
        ],
      },
      {
        label: "Elegir cómo se pide el depósito en cada servicio",
        badge: "Nuevo",
        body:
          'En Servicios, cada servicio tiene tres modos de depósito: "Sin depósito" (nunca se pide), "Opcional" (el cliente decide en tu página pública si asegura su hora pagando el adelanto o agenda sin él) y "Obligatorio" (la reserva no se confirma hasta que se paga). Elige el modo y escribe el monto (por ejemplo, 2000 o 4000). Solo se activa cuando tu cuenta de Mercado Pago está conectada.',
      },
      {
        label: "Qué ve el cliente al reservar",
        body:
          'Con modo "Opcional", al final de la reserva el cliente elige entre "Asegurar mi hora con $X" o "Agendar sin depósito". Con modo "Obligatorio", tiene que pagar sí o sí para confirmar. En ambos casos, si paga, pasa por Mercado Pago y la cita queda "Pendiente de pago" hasta que el adelanto se acredita.',
      },
      {
        label: "El horario no se bloquea para siempre",
        body:
          "Una reserva pendiente de pago retiene el horario solo 30 minutos. Si el cliente no paga dentro de ese plazo, el horario vuelve a quedar disponible para otras personas de forma automática.",
      },
      {
        label: "Cuando el pago se acredita",
        body:
          'La cita pasa a "Confirmada" y recién ahí salen los avisos por email, WhatsApp y SMS. Si el pago se rechaza o se cancela, la cita se anula sola y el horario se libera.',
      },
      {
        label: "Dejar de cobrar depósitos",
        body:
          'Puedes quitar el monto de depósito en cada servicio, o usar "Desconectar" en la tarjeta de Configuración para cortar la conexión con Mercado Pago por completo. Las citas ya confirmadas no se ven afectadas.',
      },
    ],
  },
  {
    title: "Profesionales",
    icon: IconUserCircle,
    intro: "Quién atiende en tu negocio, con su foto y sus servicios.",
    items: [
      {
        label: "Agregar un profesional",
        body:
          'En Profesionales, completa el nombre, elige un color (para diferenciarlo en la Agenda) y marca qué servicios puede realizar. Aparece de inmediato en la lista de abajo y queda disponible para reservas.',
      },
      {
        label: "Foto para la página pública",
        badge: "Nuevo",
        body:
          'Cada profesional tiene una sección "Foto para la página pública": haz clic en el círculo (o en "Subir foto") para elegir una imagen desde tu computador. Puede ser su foto o cualquier imagen que quiera mostrar. Con "Quitar" vuelve al círculo con sus iniciales. Máx. 5 MB (PNG, JPG, WEBP o GIF).',
      },
      {
        label: "Dónde se ve",
        body:
          'En tu página pública aparece una sección "Quiénes te atienden" con el nombre y la foto de cada profesional. Solo se muestran los que tienen al menos un servicio asignado — si agregaste a alguien y no aparece (ni en la lista de "Elige profesional" al reservar), es porque todavía no le marcaste ningún servicio.',
      },
      {
        label: "Pausar o eliminar un profesional",
        body:
          '"Pausar" lo saca de tu página pública y de las reservas nuevas, pero conserva su historial. "Eliminar" lo borra por completo; si ya tiene citas en su historial, se pausa en vez de borrarse para no perder esas reservas. No puedes eliminar ni pausar al único profesional activo.',
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
        label: "Cobro de depósitos (Mercado Pago)",
        badge: "Nuevo",
        body:
          'Conecta tu cuenta de Mercado Pago para poder cobrar un adelanto al reservar. El dinero llega directo a ti. El paso a paso está en la sección "Cobro de depósitos" de este manual.',
      },
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
        body:
          "Define el color de acento que se usa en botones y detalles de tu página pública y en los correos de campaña.",
      },
      {
        label: "Correo de acceso",
        badge: "Nuevo",
        body:
          'En la tarjeta "Correo de acceso" puedes cambiar el correo con el que inicias sesión (y al que te llegan los avisos de reservas nuevas). Escribes el correo nuevo y te mandamos un link de confirmación a esa dirección; el cambio se aplica al abrirlo. Hasta entonces sigues entrando con el correo actual.',
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
    intro: "Tu prueba gratis y cómo pagar el plan.",
    items: [
      {
        label: "Prueba gratis",
        body: `Tienes ${TRIAL_DAYS} días de prueba gratis desde que te registras. Puedes activar tu plan antes o esperar a que termine.`,
      },
      {
        label: "Dos formas de pagar",
        badge: "Nuevo",
        body: `El plan cuesta ${PRICE} al mes. Puedes pagarlo de dos formas: "Pagar 1 mes" — un pago único que sirve con débito, crédito o efectivo, y renuevas tú cada mes (verás "Plan al día — pagado hasta tal fecha"); o "Cobro automático" — se cobra solo cada mes, pero necesita tarjeta de crédito (varias tarjetas de débito chilenas no permiten el cobro recurrente).`,
      },
      {
        label: "Qué pasa cuando termina la prueba y no has pagado",
        body:
          "El panel se bloquea: solo puedes ver la página de Suscripción para pagar. Pero tu página pública de reservas sigue funcionando y los recordatorios siguen saliendo, para no dejar tirados a tus clientes. No se borra nada — pagas cuando quieras y todo vuelve.",
      },
      {
        label: "No confundir con el cobro de depósitos",
        body:
          "Esta suscripción es lo que pagas tú para usar Tu Hora Lista. El cobro de depósitos es distinto: es plata que tus clientes te pagan a ti al reservar, y llega directo a tu cuenta de Mercado Pago.",
      },
    ],
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Cambié el nombre del negocio y no se ve en mi página pública, ¿qué hago?",
    a: 'Revisa que hayas presionado "Guardar cambios" al final del formulario en Configuración — es un botón separado del de la foto de portada. Si ya lo guardaste y sigue sin verse, espera unos minutos y recarga la página con Ctrl+F5 (o Cmd+Shift+R en Mac) para forzar que se actualice.',
  },
  {
    q: "Un cliente no puede elegir un servicio en mi página de reservas",
    a: 'Toca en cualquier parte de la tarjeta del servicio (no solo el botón "Agendar") — debería seleccionarse y avanzar al paso siguiente. Si el problema persiste, revisa que el servicio esté "Activo" (no pausado) en la sección Servicios.',
  },
  {
    q: "¿El dinero de los depósitos pasa por Tu Hora Lista?",
    a: "No. Cada depósito llega directo a la cuenta de Mercado Pago del profesional que atiende. Tu Hora Lista nunca retiene ni administra ese dinero — solo conecta tu cuenta para que puedas cobrar el adelanto.",
  },
  {
    q: "Conecté Mercado Pago pero no puedo escribir un depósito en el servicio",
    a: 'El campo de depósito en Servicios solo se activa cuando la conexión está lista. Si acabas de conectar, recarga la página de Servicios. Si sigue sin aparecer, entra a Configuración y revisa que diga "Cuenta conectada".',
  },
  {
    q: "Un cliente pagó el depósito pero la cita sigue como pendiente",
    a: "La cita se confirma cuando Mercado Pago nos avisa que el pago se acreditó. Suele ser inmediato, pero con algunos medios de pago puede tardar unos minutos. Si pasada media hora sigue pendiente, escríbenos con la fecha y hora de la cita.",
  },
  {
    q: "¿Cómo comparto mi página de reservas?",
    a: 'El link está siempre visible arriba del menú del panel ("Tu página de reservas"), con un botón "Copiar link". Compártelo por WhatsApp, redes sociales o donde prefieras.',
  },
  {
    q: "¿Puedo tener más de un profesional atendiendo?",
    a: 'Sí. En la sección "Profesionales" agregas, editas, pausas o eliminas a cada uno, le pones su foto, sus servicios y su horario en "Disponibilidad". Tu plan incluye hasta 5 profesionales activos.',
  },
  {
    q: "En Mercado Pago no se me activa el botón para pagar la suscripción",
    a: "Mercado Pago no permite pagarte a ti mismo. Si la cuenta de Mercado Pago con la que estás pagando es la misma que recibe el dinero (o está vinculada), el botón queda deshabilitado. Paga desde otra cuenta de Mercado Pago, o usa la opción \"Pagar 1 mes\". Un cliente normal nunca tiene este problema.",
  },
  {
    q: "¿Qué pasa con mis clientes si no pago a tiempo?",
    a: "Nada. Tu página pública de reservas sigue funcionando y los recordatorios siguen saliendo. Lo único que se bloquea es tu panel de gestión, hasta que regularices el pago. Tus datos y los de tus clientes no se pierden.",
  },
];

/** Ancla estable para cada sección (kebab-case, sin acentos). */
export function slug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
