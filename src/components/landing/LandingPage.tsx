"use client";

/**
 * Landing (/) — mismo mundo visual que /registro ("pizarra de citas de
 * noche"): fondo verde pino, texto hueso, latón en las marcas de tiempo.
 * CSS namespaced con `lp-` en un <style> local; fuentes del sistema
 * (Fraunces / Work Sans / IBM Plex Mono), sin tipografías extra.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  IconCalendar,
  IconCard,
  IconClock,
  IconGear,
  IconMegaphone,
  IconUsers,
} from "@/components/dashboard/ManualIcons";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );
}

const DAY = [
  { t: "08:00" },
  { t: "09:00", svc: "Corte", who: "Javiera R." },
  { t: "10:00", svc: "Color + secado", who: "M. José L." },
  { t: "11:00", svc: "Barba", who: "Cristóbal A." },
  { t: "12:00" },
  { t: "13:00", svc: "Manicure", who: "Soledad P." },
  { t: "14:00", svc: "Masaje 60'", who: "Rodrigo M." },
  { t: "15:00" },
  { t: "16:00", svc: "Corte", who: "Diego S." },
  { t: "17:00", svc: "Tinte raíz", who: "Francisca T." },
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
    body: "Elige el servicio, ve los horarios libres en tiempo real y confirma con su nombre y teléfono. Sin ida y vuelta de mensajes.",
  },
  {
    n: "03",
    title: "Tú te concentras en atender",
    body: "La cita queda bloqueada en tu agenda al instante. Los recordatorios y las confirmaciones se mandan solos.",
  },
];

const FEATURES = [
  {
    icon: IconCalendar,
    title: "Toda tu agenda en un solo lugar",
    body: "Ve tus citas de hoy y las próximas, en lista o en calendario semanal. Agenda manual cuando un cliente te escribe por fuera de la app.",
  },
  {
    icon: IconClock,
    title: "Recordatorios que se mandan solos",
    body: "Confirmación al reservar y recordatorio automático por email, SMS y WhatsApp antes de la cita. Los plantones bajan de verdad.",
  },
  {
    icon: IconCard,
    title: "Cobra como te acomode",
    body: "Precio fijo, «desde $X» o «a cotizar». Y si quieres, pide una seña al reservar que cae directo a tu Mercado Pago, no al nuestro.",
  },
  {
    icon: IconGear,
    title: "Tu página, a tu estilo",
    body: "Foto de portada, tipografía, color de marca y tus redes. Se ve como tu negocio, no como una plantilla genérica.",
  },
  {
    icon: IconUsers,
    title: "Tus clientes, ordenados solos",
    body: "Cada reserva arma tu base de clientes con su historial de visitas — sin que tengas que cargar nada a mano.",
  },
  {
    icon: IconMegaphone,
    title: "Reactiva a los que no vuelven",
    body: "La app te marca quién lleva mucho sin venir. Mándales una campaña por correo con un botón directo para reservar de nuevo.",
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

function Reveal({
  children,
  reduced,
  className = "",
}: {
  children: React.ReactNode;
  reduced: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const inView = shown || reduced;
  return (
    <div ref={ref} className={`lp-reveal ${inView ? "lp-reveal-in" : ""} ${className}`}>
      {children}
    </div>
  );
}

function Board({ reduced }: { reduced: boolean }) {
  return (
    <div className="lp-board" aria-hidden>
      <div className="lp-board-head">
        <span className="lp-day">Martes</span>
        <span className="lp-meta">14 reservas · 0 llamadas</span>
      </div>
      {!reduced && <div className="lp-now" />}
      <div className="lp-rows">
        {DAY.map((r, idx) => (
          <div
            key={r.t}
            className={reduced ? "lp-row lp-row-static" : "lp-row"}
            style={{ ["--i" as string]: idx }}
          >
            <span className="lp-t">{r.t}</span>
            <span className="lp-slot">
              {r.svc && (
                <span className={reduced ? "lp-block lp-block-static" : "lp-block"}>
                  <span className="lp-svc">{r.svc}</span>
                  <span className="lp-who">{r.who}</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="lp-board-foot">
        <span className="lp-tick" />
        <span>
          Cada bloque lo reservó un cliente. <b>Tú no moviste un dedo.</b>
        </span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const reduced = useReducedMotion();

  return (
    <div className="lp-root">
      <header className="lp-nav">
        <div className="lp-brand">
          <span className="lp-dot" aria-hidden />
          Tu Hora Lista
        </div>
        <nav className="lp-nav-actions">
          <Link href="/login" className="lp-navlink">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="lp-btn lp-btn-primary lp-btn-sm">
            Crear cuenta gratis
          </Link>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Para negocios de servicios · Chile</span>
            <h1 className="lp-h1">
              Deja de agendar <em>citas a mano</em>.
            </h1>
            <p className="lp-sub">
              Comparte un link, tus clientes reservan solos y tú no tienes que acordarte de
              nada. La agenda se llena mientras tú atiendes.
            </p>
            <div className="lp-cta-row">
              <Link href="/registro" className="lp-btn lp-btn-primary">
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="lp-btn lp-btn-ghost">
                Iniciar sesión
              </Link>
            </div>
            <ul className="lp-trust">
              <li>Sin tarjeta de crédito</li>
              <li>10 días gratis</li>
              <li>Cancela cuando quieras</li>
            </ul>
          </div>

          <div className="lp-hero-visual">
            <Board reduced={reduced} />
          </div>
        </section>

        <section className="lp-band">
          <div className="lp-wrap">
            <h2 className="lp-h2 lp-center">Tres pasos, y listo</h2>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} reduced={reduced} className="lp-step">
                  <li style={{ ["--d" as string]: i }}>
                    <span className="lp-step-n">{s.n}</span>
                    <h3 className="lp-step-title">{s.title}</h3>
                    <p className="lp-step-body">{s.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-center lp-section-head">
              <h2 className="lp-h2">Todo lo que necesitas, nada de lo que no</h2>
              <p className="lp-section-sub">
                Construida para que la manejes tú, sin depender de nadie.
              </p>
            </div>
            <div className="lp-features">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} reduced={reduced} className="lp-feature">
                    <div style={{ ["--d" as string]: i % 3 }}>
                      <span className="lp-feature-ic">
                        <Icon className="lp-ic" />
                      </span>
                      <h3 className="lp-feature-title">{f.title}</h3>
                      <p className="lp-feature-body">{f.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-band lp-band-tight">
          <div className="lp-wrap lp-center">
            <p className="lp-kicker">Hecha para negocios como el tuyo</p>
            <div className="lp-chips">
              {AUDIENCE.map((a) => (
                <span key={a} className="lp-chip">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div aria-hidden className="lp-final-glow" />
          <div className="lp-wrap lp-center lp-final-inner">
            <h2 className="lp-h2 lp-final-h">Tu primera reserva puede llegar hoy</h2>
            <p className="lp-final-sub">
              Crea tu cuenta, arma tu página en minutos y comparte el link. 10 días gratis, sin
              tarjeta de crédito.
            </p>
            <Link href="/registro" className="lp-btn lp-btn-primary lp-btn-lg">
              Crear cuenta gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <p>© {new Date().getFullYear()} Tu Hora Lista</p>
        <div className="lp-footer-links">
          <Link href="/terminos">Términos de Servicio</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/registro">Crear cuenta</Link>
        </div>
      </footer>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.lp-root {
  --lp-ground:     #14211b;
  --lp-ground-2:   #1b2b23;
  --lp-bone:       #f3efe4;
  --lp-bone-dim:   #afa996;
  --lp-bone-faint: #6f6b5e;
  --lp-brass:      #c99a4e;
  --lp-brass-dim:  #8a6c3c;
  --lp-line:       #2c3f34;
  --lp-jade:       #82b6a0;
  --lp-signal:     #f0e7d3;
  --lp-display: var(--font-fraunces), Georgia, serif;
  --lp-body: var(--font-work-sans), system-ui, sans-serif;
  --lp-mono: var(--font-plex-mono), ui-monospace, monospace;

  background: var(--lp-ground);
  color: var(--lp-bone);
  font-family: var(--lp-body);
  font-size: 16px;
  line-height: 1.6;
}
.lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }

.lp-wrap { max-width: 1080px; margin: 0 auto; }
.lp-center { text-align: center; }

/* ── nav ─────────────────────────────────────────────────────────── */
.lp-nav {
  max-width: 1080px; margin: 0 auto;
  padding: clamp(18px, 3vw, 26px) clamp(20px, 5vw, 40px);
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.lp-brand {
  display: flex; align-items: center; gap: 9px;
  font-family: var(--lp-display); font-weight: 600; font-size: 18px;
  letter-spacing: -0.01em;
}
.lp-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--lp-brass); box-shadow: 0 0 0 4px #c99a4e22;
}
.lp-nav-actions { display: flex; align-items: center; gap: 14px; }
.lp-navlink {
  font-size: 14px; color: var(--lp-bone-dim); text-decoration: none;
  transition: color .18s;
}
.lp-navlink:hover { color: var(--lp-bone); }
.lp-navlink:focus-visible,
.lp-btn:focus-visible {
  outline: 2px solid var(--lp-brass); outline-offset: 3px; border-radius: 8px;
}

/* ── buttons ─────────────────────────────────────────────────────── */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font: inherit; font-weight: 600; text-decoration: none;
  border-radius: 11px; padding: 13px 20px; cursor: pointer;
  transition: transform .12s ease, background .18s, border-color .18s, color .18s;
}
.lp-btn-sm { padding: 9px 15px; font-size: 14px; border-radius: 9px; }
.lp-btn-lg { padding: 15px 26px; font-size: 16px; }
.lp-btn-primary {
  position: relative; background: var(--lp-signal); color: #16241d;
  overflow: hidden; isolation: isolate;
}
.lp-btn-primary::after {
  content: ""; position: absolute; inset: -45%; z-index: -1;
  background: radial-gradient(closest-side, #f4e6c6 0%, transparent 70%);
  opacity: 0; transition: opacity .3s ease;
}
.lp-btn-primary:hover::after { opacity: .7; }
.lp-btn-primary:active { transform: translateY(1px); }
.lp-btn-ghost {
  background: transparent; color: var(--lp-bone);
  border: 1px solid var(--lp-line);
}
.lp-btn-ghost:hover { border-color: var(--lp-brass); }

/* ── hero ────────────────────────────────────────────────────────── */
.lp-hero {
  max-width: 1080px; margin: 0 auto;
  padding: clamp(28px, 6vw, 68px) clamp(20px, 5vw, 40px) clamp(48px, 9vw, 96px);
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.04fr);
  gap: clamp(30px, 5vw, 64px); align-items: center;
}
.lp-eyebrow {
  display: block; font-family: var(--lp-mono);
  font-size: 11.5px; font-weight: 500; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--lp-brass); margin-bottom: 18px;
}
.lp-h1 {
  font-family: var(--lp-display); font-weight: 500;
  font-size: clamp(36px, 6.6vw, 62px); line-height: 1.03;
  letter-spacing: -0.02em; text-wrap: balance; margin: 0 0 20px;
}
.lp-h1 em { font-style: italic; color: var(--lp-brass); }
.lp-sub {
  font-size: clamp(15px, 1.9vw, 18px); color: var(--lp-bone-dim);
  max-width: 44ch; margin: 0 0 28px;
}
.lp-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
.lp-trust {
  display: flex; flex-wrap: wrap; gap: 8px 20px;
  list-style: none; padding: 0; margin: 0;
  font-size: 13.5px; color: var(--lp-bone-dim);
}
.lp-trust li { position: relative; padding-left: 22px; }
.lp-trust li::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 15px; height: 15px; border-radius: 50%; border: 1px solid var(--lp-jade);
}
.lp-trust li::after {
  content: ""; position: absolute; left: 5px; top: 50%;
  width: 4px; height: 7px;
  border: solid var(--lp-jade); border-width: 0 1.5px 1.5px 0;
  transform: translateY(-62%) rotate(43deg);
}

/* ── board (signature, compartida con /registro) ─────────────────── */
.lp-board {
  position: relative; background: var(--lp-ground-2);
  border: 1px solid var(--lp-line); border-radius: 16px;
  padding: 18px 18px 14px; box-shadow: 0 30px 70px -34px #000000a0;
  overflow: hidden;
}
.lp-board-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 2px 4px 12px; border-bottom: 1px solid var(--lp-line); margin-bottom: 6px;
}
.lp-day { font-family: var(--lp-display); font-size: 15px; font-weight: 500; }
.lp-meta {
  font-family: var(--lp-mono); font-size: 11px; color: var(--lp-bone-faint);
  letter-spacing: 0.04em;
}
.lp-now {
  position: absolute; left: 58px; right: 14px; height: 1px;
  background: linear-gradient(90deg, var(--lp-brass), #c99a4e00);
  top: 12%; z-index: 3; animation: lp-sweep 24s linear infinite;
}
.lp-now::before {
  content: ""; position: absolute; left: -5px; top: -3px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--lp-brass); box-shadow: 0 0 10px 1px #c99a4e88;
}
@keyframes lp-sweep {
  0% { top: 9%; opacity: 0; } 6% { opacity: 1; }
  94% { opacity: 1; } 100% { top: 93%; opacity: 0; }
}
.lp-row {
  position: relative; display: grid; grid-template-columns: 44px 1fr;
  gap: 12px; align-items: center; min-height: 44px;
  opacity: 0; transform: translateY(6px);
  animation: lp-rowin .5s cubic-bezier(.2,.7,.2,1) forwards;
  animation-delay: calc(var(--i) * 55ms);
}
.lp-row-static { opacity: 1; transform: none; animation: none; }
@keyframes lp-rowin { to { opacity: 1; transform: none; } }
.lp-t {
  font-family: var(--lp-mono); font-size: 11.5px; color: var(--lp-bone-faint);
  text-align: right; letter-spacing: 0.02em;
}
.lp-slot { position: relative; height: 34px; }
.lp-slot::before {
  content: ""; position: absolute; left: 0; right: 0; top: 50%;
  border-top: 1px dashed #2c3f3455;
}
.lp-block {
  position: absolute; inset: 0; display: flex; align-items: center; gap: 10px;
  padding: 0 12px; border-radius: 9px;
  background: linear-gradient(180deg, #26392f, #203029);
  border: 1px solid #34493d; border-left: 3px solid var(--lp-jade);
  font-size: 13px; color: var(--lp-bone);
  transform: scale(.96); opacity: 0;
  animation: lp-blockin .5s cubic-bezier(.2,.8,.2,1) forwards;
  animation-delay: calc(var(--i) * 55ms + 260ms);
}
.lp-block-static { transform: none; opacity: 1; animation: none; }
.lp-svc { color: var(--lp-bone-dim); }
.lp-who { font-weight: 600; }
.lp-who::before { content: "·"; color: var(--lp-bone-faint); margin: 0 7px 0 5px; }
@keyframes lp-blockin {
  0% { transform: scale(.96); opacity: 0; border-left-color: var(--lp-brass); }
  60% { border-left-color: var(--lp-brass); }
  100% { transform: scale(1); opacity: 1; border-left-color: var(--lp-jade); }
}
.lp-board-foot {
  margin-top: 10px; padding: 11px 12px; border-radius: 10px;
  background: #16221c; border: 1px solid var(--lp-line);
  font-size: 12.5px; color: var(--lp-bone-dim);
  display: flex; align-items: center; gap: 9px;
}
.lp-board-foot b { color: var(--lp-bone); font-weight: 600; }
.lp-tick {
  width: 15px; height: 15px; flex: none; border-radius: 50%;
  border: 1.5px solid var(--lp-jade); display: grid; place-items: center;
}
.lp-tick::after {
  content: ""; width: 5px; height: 8px;
  border: solid var(--lp-jade); border-width: 0 1.5px 1.5px 0;
  transform: rotate(43deg) translateY(-1px);
}

/* ── section rhythm ──────────────────────────────────────────────── */
.lp-band {
  background: var(--lp-ground-2);
  border-top: 1px solid var(--lp-line); border-bottom: 1px solid var(--lp-line);
  padding: clamp(44px, 8vw, 84px) clamp(20px, 5vw, 40px);
}
.lp-band-tight { padding: clamp(34px, 6vw, 56px) clamp(20px, 5vw, 40px); }
.lp-section { padding: clamp(48px, 9vw, 96px) clamp(20px, 5vw, 40px); }

.lp-h2 {
  font-family: var(--lp-display); font-weight: 500;
  font-size: clamp(24px, 3.4vw, 34px); line-height: 1.12;
  letter-spacing: -0.015em; text-wrap: balance; margin: 0;
}
.lp-section-head { max-width: 34ch; margin: 0 auto clamp(30px, 5vw, 52px); }
.lp-section-sub { color: var(--lp-bone-dim); margin: 12px 0 0; }

/* ── steps (secuencia real → numeración legítima) ────────────────── */
.lp-steps {
  list-style: none; padding: 0; margin: clamp(28px, 5vw, 44px) 0 0;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(20px, 4vw, 40px);
}
.lp-step-n {
  font-family: var(--lp-mono); font-size: 13px; font-weight: 500;
  color: var(--lp-brass); letter-spacing: 0.08em;
}
.lp-step-title { font-size: 17px; font-weight: 600; margin: 10px 0 6px; }
.lp-step-body { font-size: 13.5px; color: var(--lp-bone-dim); margin: 0; }

/* ── features ────────────────────────────────────────────────────── */
.lp-features {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.lp-feature > div {
  height: 100%;
  background: linear-gradient(180deg, #21332a 0%, #1a2a22 100%);
  border: 1px solid var(--lp-line); border-radius: 14px; padding: 20px;
  transition: transform .16s ease, border-color .16s ease;
}
.lp-feature > div:hover { transform: translateY(-3px); border-color: #3c5346; }
.lp-feature-ic {
  display: inline-flex; width: 38px; height: 38px; border-radius: 10px;
  align-items: center; justify-content: center; margin-bottom: 14px;
  background: #16221c; border: 1px solid var(--lp-line); color: var(--lp-brass);
}
.lp-ic { width: 19px; height: 19px; }
.lp-feature-title { font-size: 15.5px; font-weight: 600; margin: 0 0 6px; }
.lp-feature-body { font-size: 13px; color: var(--lp-bone-dim); margin: 0; line-height: 1.55; }

/* ── audience chips ──────────────────────────────────────────────── */
.lp-kicker {
  font-family: var(--lp-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--lp-brass-dim); margin: 0 0 18px;
}
.lp-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
.lp-chip {
  font-size: 13.5px; color: var(--lp-bone-dim);
  background: var(--lp-ground); border: 1px solid var(--lp-line);
  border-radius: 999px; padding: 8px 15px;
}

/* ── final CTA ───────────────────────────────────────────────────── */
.lp-final {
  position: relative; overflow: hidden;
  background: #10192f00;
  background-color: #101a15;
  border-top: 1px solid var(--lp-line);
  padding: clamp(52px, 10vw, 104px) clamp(20px, 5vw, 40px);
}
.lp-final-glow {
  position: absolute; left: 50%; top: 40%; width: 620px; height: 620px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #c99a4e22 0%, transparent 62%);
  pointer-events: none;
}
.lp-final-inner { position: relative; max-width: 620px; }
.lp-final-h { font-size: clamp(27px, 4.4vw, 42px); }
.lp-final-sub { color: var(--lp-bone-dim); margin: 16px auto 30px; max-width: 42ch; }

/* ── footer ──────────────────────────────────────────────────────── */
.lp-footer {
  max-width: 1080px; margin: 0 auto;
  padding: 28px clamp(20px, 5vw, 40px);
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 12px; font-size: 13px; color: var(--lp-bone-faint);
}
.lp-footer-links { display: flex; flex-wrap: wrap; gap: 18px; }
.lp-footer-links a { color: var(--lp-bone-faint); text-decoration: none; }
.lp-footer-links a:hover { color: var(--lp-bone-dim); }

/* ── reveal on scroll ────────────────────────────────────────────── */
.lp-reveal {
  opacity: 0; transform: translateY(14px);
  transition: opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1);
  transition-delay: calc(var(--d, 0) * 80ms);
}
.lp-reveal-in { opacity: 1; transform: none; }

/* ── responsive ──────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .lp-hero { grid-template-columns: 1fr; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-features { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .lp-nav-actions .lp-navlink { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-row, .lp-block { animation: none !important; opacity: 1; transform: none; }
  .lp-now { display: none; }
  .lp-reveal { opacity: 1; transform: none; transition: none; }
  .lp-btn-primary::after { transition: none; }
  .lp-feature > div { transition: none; }
}
`;
