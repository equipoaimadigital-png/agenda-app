import Link from "next/link";
import {
  IconCalendar,
  IconCard,
  IconChart,
  IconClipboard,
  IconClock,
  IconGear,
  IconMegaphone,
  IconUsers,
} from "@/components/dashboard/ManualIcons";

const FEATURES = [
  {
    icon: IconCalendar,
    title: "Toda tu agenda en un solo lugar",
    body: "Ve tus citas de hoy y las próximas, en lista o en calendario semanal. Agenda manual cuando un cliente te escribe por fuera de la app.",
  },
  {
    icon: IconClock,
    title: "Recordatorios que se mandan solos",
    body: "Un correo de confirmación al reservar y un recordatorio automático antes de la cita. Menos clientes que no llegan, sin que tú tengas que acordarte.",
  },
  {
    icon: IconCard,
    title: "Cobra como te acomode",
    body: "Precio fijo, \"desde $X\" para servicios que varían, o \"a cotizar\" si trabajas por consulta — como abogados o consultores.",
  },
  {
    icon: IconGear,
    title: "Tu página, a tu estilo",
    body: "Foto de portada, tipografía, color de marca y tus redes sociales. Se ve como tu negocio, no como una plantilla genérica.",
  },
  {
    icon: IconUsers,
    title: "Tus clientes, ordenados solos",
    body: "Cada reserva arma tu base de clientes con su historial de visitas — sin que tengas que cargar nada a mano.",
  },
  {
    icon: IconMegaphone,
    title: "Reactiva clientes por email",
    body: "Manda una campaña a quienes no han vuelto en un tiempo, con un botón directo para que reserven de nuevo.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Comparte tu link",
    body: "Un solo link con tus servicios y horarios disponibles. Lo pegas en tu Instagram, WhatsApp o donde ya te encuentran tus clientes.",
  },
  {
    n: "02",
    title: "Tu cliente reserva solo",
    body: "Elige el servicio, ve los horarios libres en tiempo real, y confirma con su nombre y teléfono. Sin ida y vuelta de mensajes.",
  },
  {
    n: "03",
    title: "Tú te concentras en atender",
    body: "La cita queda bloqueada en tu agenda al instante. Los recordatorios y las confirmaciones se mandan solos.",
  },
];

const AUDIENCE = [
  "Peluquerías y barberías",
  "Estudios jurídicos",
  "Consultores y asesores",
  "Entrenadores personales",
  "Terapeutas y psicólogos",
  "Clínicas dentales",
];

export default function Home() {
  return (
    <main className="bg-paper text-ink">
      {/* Nav */}
      <header className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden
            className="w-8 h-8 rounded-lg bg-brand text-brand-foreground flex items-center justify-center font-display font-semibold text-sm"
          >
            T
          </div>
          <span className="font-display font-semibold">Tu Hora Lista</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-stone hover:text-ink">
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="text-sm font-semibold bg-brand text-brand-foreground rounded-lg px-4 py-2 shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.1)]"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brass mb-4">
            Para negocios de servicios
          </p>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.08] text-balance">
            Deja de agendar citas a mano
          </h1>
          <p className="text-stone text-lg mt-5 max-w-md">
            Comparte un link, tus clientes reservan solos, y tú no tienes que
            acordarte de nada. Así de simple.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              href="/registro"
              className="bg-brand text-brand-foreground rounded-xl px-6 py-3.5 font-semibold shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px] transition-all"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="bg-surface border border-border rounded-xl px-6 py-3.5 font-semibold shadow-[0_2px_0_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.04)]"
            >
              Iniciar sesión
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-6 text-sm text-stone font-medium">
            <li>✓ Sin tarjeta de crédito</li>
            <li>✓ 14 días gratis</li>
            <li>✓ Cancela cuando quieras</li>
          </ul>
        </div>

        {/* Mockup ilustrativo de la página pública */}
        <div aria-hidden className="relative">
          <div className="rounded-2xl overflow-hidden border border-border shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_60px_rgba(0,0,0,0.16)] bg-surface">
            <div className="relative bg-ink text-white px-5 pt-6 pb-8">
              <div aria-hidden className="absolute inset-0 seal-texture" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center font-display font-semibold ring-2 ring-white/15">
                  E
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/60">Reserva tu hora</p>
                  <p className="font-display font-semibold">Estudio Aurora</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="rounded-xl border border-border p-3.5 flex items-center justify-between bg-paper">
                <div>
                  <p className="font-semibold text-sm">Corte + barba</p>
                  <p className="text-xs text-stone">45 min · $18.000</p>
                </div>
                <span className="text-xs font-semibold bg-brand text-brand-foreground rounded-lg px-3 py-1.5">
                  Agendar
                </span>
              </div>
              <div className="rounded-xl border border-border p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Balayage</p>
                  <p className="text-xs text-stone">120 min · Desde $65.000</p>
                </div>
                <span className="text-xs font-semibold border border-border rounded-lg px-3 py-1.5">
                  Agendar
                </span>
              </div>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -bottom-4 -left-4 bg-surface border border-border rounded-xl px-3.5 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.12)] hidden sm:flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-semibold">Reserva confirmada</span>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-center max-w-lg mx-auto">
            Tres pasos, y listo
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 mt-12">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="font-display text-3xl text-brass mb-2">{s.n}</p>
                <h3 className="font-semibold text-lg mb-1.5">{s.title}</h3>
                <p className="text-stone text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center max-w-lg mx-auto mb-12">
          <h2 className="font-display font-semibold text-2xl sm:text-3xl">
            Todo lo que necesitas, nada de lo que no
          </h2>
          <p className="text-stone mt-3">
            Construida para que la uses vos mismo, sin depender de nadie más.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-surface border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.05)]"
              >
                <span className="inline-flex w-10 h-10 rounded-xl bg-brand-soft text-brand items-center justify-center mb-3.5">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-stone leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* A quién sirve */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone mb-5">
            Hecha para negocios como el tuyo
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {AUDIENCE.map((a) => (
              <span
                key={a}
                className="text-sm font-medium bg-paper border border-border rounded-full px-4 py-2"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative bg-ink text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 seal-texture" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">
            Tu primera reserva puede llegar hoy
          </h2>
          <p className="text-white/70 mt-4 max-w-md mx-auto">
            Crea tu cuenta, arma tu página en minutos y comparte el link.
            14 días gratis, sin tarjeta de crédito.
          </p>
          <Link
            href="/registro"
            className="inline-block bg-brand text-brand-foreground rounded-xl px-7 py-3.5 font-semibold mt-8 shadow-[0_3px_0_rgba(0,0,0,0.25),0_10px_24px_rgba(0,0,0,0.3)] active:shadow-[0_1px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] transition-all"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-stone">
        <p>© {new Date().getFullYear()} Tu Hora Lista</p>
        <div className="flex gap-5">
          <Link href="/terminos" className="hover:text-ink">Términos de Servicio</Link>
          <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
          <Link href="/login" className="hover:text-ink">Iniciar sesión</Link>
          <Link href="/registro" className="hover:text-ink">Crear cuenta</Link>
        </div>
      </footer>
    </main>
  );
}
