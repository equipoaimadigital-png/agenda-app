"use client";

/**
 * Pantalla de registro — mundo visual propio: "pizarra de citas de noche".
 * Deliberadamente distinta del resto de la app (fondo verde pino, no el
 * papel hueso): es la primera impresión y tiene que vender. Se apoya en las
 * fuentes del sistema (Fraunces / Work Sans / IBM Plex Mono) para no cargar
 * tipografías extra y seguir sintiéndose parte de "El Sello".
 *
 * Todo el CSS va namespaced con `re-` y vive en un <style> local para no
 * tocar el sistema de diseño global.
 */

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

type State = { error: string } | undefined;

const FEATURES: [string, string][] = [
  ["CRM de clientes", "cada persona con su historial, sus datos y tus notas"],
  ["Métricas de tu semana", "cuántas reservas, cuánto entra y qué día flojea"],
  ["Recordatorios automáticos", "email, SMS y WhatsApp, sin que muevas un dedo"],
  ["Seña al reservar", "un adelanto que cae directo a tu Mercado Pago"],
  ["Tu página de reservas", "con tu foto, tu color y un link para compartir"],
  ["Tu equipo", "hasta 5 profesionales, cada uno con su agenda y su foto"],
  ["Reactivación", "te marca los clientes que llevan mucho sin volver"],
  ["Campañas por correo", "escríbeles a todos con la imagen de tu marca"],
];

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
  { t: "18:00" },
];

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

function FeatureTicker({ reduced }: { reduced: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % FEATURES.length), 2900);
    return () => clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <div className="re-ticker">
        <span className="re-ticker-tag">Incluye</span>
        <span className="re-ticker-slot">
          <b>CRM de clientes</b>, métricas de tu semana, recordatorios automáticos, seña al
          reservar, reactivación y campañas — todo incluido.
        </span>
      </div>
    );
  }

  const [head, tail] = FEATURES[i];
  return (
    <div className="re-ticker" aria-live="polite">
      <span className="re-ticker-tag">Incluye</span>
      <span key={i} className="re-ticker-slot re-ticker-anim">
        <b>{head}</b> — {tail}
      </span>
    </div>
  );
}

function Board({ reduced }: { reduced: boolean }) {
  return (
    <section className="re-board" aria-label="Ejemplo de un día de agenda">
      <div className="re-board-head">
        <span className="re-day">Martes</span>
        <span className="re-meta">14 reservas · 0 llamadas</span>
      </div>
      {!reduced && <div className="re-now" aria-hidden />}

      <div className="re-rows">
        {DAY.map((r, idx) => (
          <div
            key={r.t}
            className={reduced ? "re-row re-row-static" : "re-row"}
            style={{ ["--i" as string]: idx }}
          >
            <span className="re-t">{r.t}</span>
            <span className="re-slot">
              {r.svc && (
                <span className={reduced ? "re-block re-block-static" : "re-block"}>
                  <span className="re-svc">{r.svc}</span>
                  <span className="re-who">{r.who}</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="re-board-foot">
        <span className="re-tick" aria-hidden />
        <span>
          Cada bloque lo reservó un cliente. <b>Tú no moviste un dedo.</b>
        </span>
      </div>
      <p className="re-caption">
        Así se ve un martes cualquiera. El link de reservas trabaja 24/7 — también mientras
        atiendes, mientras almuerzas y mientras duermes.
      </p>
    </section>
  );
}

export function RegisterExperience() {
  const reduced = useReducedMotion();
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => signUp(formData),
    undefined
  );
  // Re-lanza la coreografía de carga cuando las fuentes terminan de cargar,
  // para que el "se va llenando" se lea limpio.
  const [choreoKey, setChoreoKey] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let done = false;
    const bump = () => {
      if (!done) {
        done = true;
        setChoreoKey((k) => k + 1);
      }
    };
    if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(bump, 30));
    const fallback = setTimeout(bump, 400);
    return () => clearTimeout(fallback);
  }, [reduced]);

  return (
    <div className="re-root">
      <div className="re-wrap">
        <header className="re-top">
          <div className="re-brand">
            <span className="re-dot" aria-hidden />
            Tu Hora Lista
          </div>
          <Link className="re-login" href="/login">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </header>

        <main className="re-stage">
          <section className="re-pitch">
            <span className="re-eyebrow">Agenda online · profesionales independientes · Chile</span>
            <h1 className="re-h1">
              Tu agenda se llena <em>mientras tú atiendes</em>.
            </h1>
            <p className="re-sub">
              Tus clientes reservan solos, a cualquier hora, desde un link.{" "}
              <strong>Sin choques de hora.</strong> Con recordatorio automático por WhatsApp —
              los plantones bajan de verdad.
            </p>

            <FeatureTicker reduced={reduced} />

            <form action={formAction} className="re-card">
              <div className="re-field">
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  placeholder=" "
                  autoComplete="organization"
                />
                <label htmlFor="businessName">Nombre de tu negocio</label>
              </div>
              <div className="re-field">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder=" "
                  autoComplete="email"
                />
                <label htmlFor="email">Tu correo</label>
              </div>
              <div className="re-field">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder=" "
                  autoComplete="new-password"
                />
                <label htmlFor="password">Crea una contraseña</label>
              </div>

              {state?.error && <p className="re-error">{state.error}</p>}

              <button className="re-cta" type="submit" disabled={isPending}>
                {isPending ? "Creando tu agenda…" : "Empezar gratis — 10 días"}
              </button>
              <p className="re-fineprint">
                <b>Sin tarjeta.</b> Sin instalar nada. Cancelas cuando quieras.
              </p>
              <p className="re-terms">
                Al crear tu cuenta aceptas los{" "}
                <Link href="/terminos" target="_blank">
                  Términos
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" target="_blank">
                  Política de Privacidad
                </Link>
                .
              </p>
            </form>
          </section>

          <Board key={choreoKey} reduced={reduced} />
        </main>

        <section className="re-proof">
          <div className="re-proof-grid">
            <div className="re-pt">
              <span className="re-n">SIN CHOQUES</span>
              <h3>Dos personas, nunca la misma hora</h3>
              <p>El sistema bloquea el cupo apenas alguien lo toma. Se acabó el doble agendamiento.</p>
            </div>
            <div className="re-pt">
              <span className="re-n">MENOS PLANTONES</span>
              <h3>El recordatorio siempre llega</h3>
              <p>Email, SMS y WhatsApp automáticos, 12 horas antes. El cliente no se olvida.</p>
            </div>
            <div className="re-pt">
              <span className="re-n">COBRA ANTES</span>
              <h3>Pide una seña al reservar</h3>
              <p>Un adelanto para asegurar la hora. Cae directo a tu Mercado Pago, no al nuestro.</p>
            </div>
          </div>
          <p className="re-clients">
            Peluqueros, kinesiólogos, entrenadores, terapeutas y tatuadores <b>ya la usan</b>.
          </p>
        </section>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.re-root {
  --re-ground:     #14211b;
  --re-ground-2:   #1b2b23;
  --re-bone:       #f3efe4;
  --re-bone-dim:   #afa996;
  --re-bone-faint: #6f6b5e;
  --re-brass:      #c99a4e;
  --re-brass-dim:  #8a6c3c;
  --re-line:       #2c3f34;
  --re-jade:       #82b6a0;
  --re-signal:     #f0e7d3;
  --re-display: var(--font-fraunces), Georgia, serif;
  --re-body: var(--font-work-sans), system-ui, sans-serif;
  --re-mono: var(--font-plex-mono), ui-monospace, monospace;

  min-height: 100vh;
  min-height: 100svh;
  background: var(--re-ground);
  background-image: radial-gradient(120% 80% at 12% 0%, #1d3128 0%, var(--re-ground) 60%);
  color: var(--re-bone);
  font-family: var(--re-body);
  font-size: 16px;
  line-height: 1.6;
}
.re-root *, .re-root *::before, .re-root *::after { box-sizing: border-box; }

.re-wrap {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(22px, 4vw, 40px) clamp(20px, 5vw, 56px) 64px;
}

.re-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: clamp(36px, 7vw, 72px);
}
.re-brand {
  display: flex; align-items: center; gap: 9px;
  font-family: var(--re-display); font-weight: 600; font-size: 19px;
  letter-spacing: -0.01em;
}
.re-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--re-brass); box-shadow: 0 0 0 4px #c99a4e22;
}
.re-login {
  font-size: 13.5px; color: var(--re-bone-dim); text-decoration: none;
  border-bottom: 1px solid transparent; transition: color .2s, border-color .2s;
}
.re-login:hover { color: var(--re-bone); border-color: var(--re-brass); }
.re-login:focus-visible { outline: 2px solid var(--re-brass); outline-offset: 3px; border-radius: 2px; }

.re-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  gap: clamp(28px, 5vw, 68px);
  align-items: start;
}

.re-eyebrow {
  font-family: var(--re-mono); font-size: 11.5px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--re-brass);
  display: block; margin-bottom: 20px;
}
.re-h1 {
  font-family: var(--re-display); font-weight: 500;
  font-size: clamp(34px, 6.4vw, 58px); line-height: 1.04;
  letter-spacing: -0.02em; text-wrap: balance; margin: 0 0 20px;
}
.re-h1 em { font-style: italic; color: var(--re-brass); }
.re-sub {
  font-size: clamp(15px, 1.9vw, 17.5px); color: var(--re-bone-dim);
  max-width: 42ch; margin: 0 0 30px;
}
.re-sub strong { color: var(--re-bone); font-weight: 600; }

.re-ticker {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 28px; min-height: 44px; font-size: 13.5px;
}
.re-ticker-tag {
  flex: none; font-family: var(--re-mono); font-size: 10.5px;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--re-brass);
  padding-top: 3px;
}
.re-ticker-slot { color: var(--re-bone-dim); line-height: 1.5; max-width: 40ch; }
.re-ticker-slot b { color: var(--re-bone); font-weight: 600; }
.re-ticker-anim { animation: re-tick-in .45s ease; }
@keyframes re-tick-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.re-card {
  background: linear-gradient(180deg, #21332a 0%, #1a2a22 100%);
  border: 1px solid var(--re-line); border-radius: 14px;
  padding: 22px 22px 24px;
  box-shadow: 0 1px 0 #ffffff0a inset, 0 24px 50px -24px #00000080;
  display: flex; flex-direction: column;
}
.re-field { position: relative; margin-bottom: 12px; }
.re-field input {
  width: 100%; background: #14201b; border: 1px solid var(--re-line);
  border-radius: 10px; padding: 22px 14px 9px;
  font: inherit; font-size: 15px; color: var(--re-bone);
  outline: none; transition: border-color .18s, box-shadow .18s;
}
.re-field input::placeholder { color: transparent; }
.re-field input:focus { border-color: var(--re-brass); box-shadow: 0 0 0 3px #c99a4e26; }
.re-field label {
  position: absolute; left: 15px; top: 15px; font-size: 15px;
  color: var(--re-bone-faint); pointer-events: none; transform-origin: left top;
  transition: transform .16s ease, color .16s, letter-spacing .16s;
}
.re-field input:focus + label,
.re-field input:not(:placeholder-shown) + label {
  transform: translateY(-9px) scale(0.74);
  color: var(--re-brass); letter-spacing: 0.04em;
}

.re-error {
  margin: 2px 0 10px; font-size: 13px; color: #f0b8a6;
  background: #3a221c; border: 1px solid #5a3128;
  border-radius: 9px; padding: 8px 11px;
}

.re-cta {
  position: relative; width: 100%; margin-top: 6px;
  border: 0; border-radius: 11px; padding: 15px 18px;
  background: var(--re-signal); color: #16241d;
  font: inherit; font-weight: 600; font-size: 15.5px; letter-spacing: 0.01em;
  cursor: pointer; overflow: hidden; isolation: isolate;
  transition: transform .12s ease, opacity .12s ease;
}
.re-cta::after {
  content: ""; position: absolute; inset: -40%; z-index: -1;
  background: radial-gradient(closest-side, #f4e6c6 0%, transparent 70%);
  opacity: 0; transition: opacity .3s ease;
}
.re-cta:hover::after { opacity: .7; }
.re-cta:active { transform: translateY(1px); }
.re-cta:disabled { opacity: .55; cursor: default; }
.re-cta:focus-visible { outline: 2px solid var(--re-brass); outline-offset: 3px; }

.re-fineprint { margin: 12px 0 0; font-size: 12.5px; color: var(--re-bone-faint); text-align: center; }
.re-fineprint b { color: var(--re-bone-dim); font-weight: 500; }
.re-terms { margin: 8px 0 0; font-size: 11.5px; color: var(--re-bone-faint); text-align: center; }
.re-terms a { color: var(--re-bone-dim); text-decoration: underline; }
.re-terms a:hover { color: var(--re-bone); }

.re-board {
  position: relative; background: var(--re-ground-2);
  border: 1px solid var(--re-line); border-radius: 14px;
  padding: 18px 18px 14px; box-shadow: 0 24px 60px -30px #00000090;
  overflow: hidden;
}
.re-board-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 2px 4px 12px; border-bottom: 1px solid var(--re-line); margin-bottom: 6px;
}
.re-day { font-family: var(--re-display); font-size: 15px; font-weight: 500; }
.re-meta { font-family: var(--re-mono); font-size: 11px; color: var(--re-bone-faint); letter-spacing: 0.04em; }

.re-now {
  position: absolute; left: 58px; right: 14px; height: 1px;
  background: linear-gradient(90deg, var(--re-brass), #c99a4e00);
  top: 12%; z-index: 3; animation: re-sweep 24s linear infinite;
}
.re-now::before {
  content: ""; position: absolute; left: -5px; top: -3px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--re-brass); box-shadow: 0 0 10px 1px #c99a4e88;
}
@keyframes re-sweep {
  0% { top: 9%; opacity: 0; } 6% { opacity: 1; }
  94% { opacity: 1; } 100% { top: 93%; opacity: 0; }
}

.re-row {
  position: relative; display: grid; grid-template-columns: 44px 1fr;
  gap: 12px; align-items: center; min-height: 46px;
  opacity: 0; transform: translateY(6px);
  animation: re-rowin .5s cubic-bezier(.2,.7,.2,1) forwards;
  animation-delay: calc(var(--i) * 55ms);
}
.re-row-static { opacity: 1; transform: none; animation: none; }
@keyframes re-rowin { to { opacity: 1; transform: none; } }

.re-t {
  font-family: var(--re-mono); font-size: 11.5px; color: var(--re-bone-faint);
  text-align: right; letter-spacing: 0.02em;
}
.re-slot { position: relative; height: 34px; }
.re-slot::before {
  content: ""; position: absolute; left: 0; right: 0; top: 50%;
  border-top: 1px dashed #2c3f3455;
}

.re-block {
  position: absolute; inset: 0; display: flex; align-items: center; gap: 10px;
  padding: 0 12px; border-radius: 9px;
  background: linear-gradient(180deg, #26392f, #203029);
  border: 1px solid #34493d; border-left: 3px solid var(--re-jade);
  font-size: 13px; color: var(--re-bone);
  transform: scale(.96); opacity: 0;
  animation: re-blockin .5s cubic-bezier(.2,.8,.2,1) forwards;
  animation-delay: calc(var(--i) * 55ms + 260ms);
}
.re-block-static { transform: none; opacity: 1; animation: none; border-left-color: var(--re-jade); }
.re-svc { color: var(--re-bone-dim); }
.re-who { font-weight: 600; }
.re-who::before { content: "·"; color: var(--re-bone-faint); margin: 0 7px 0 5px; }
@keyframes re-blockin {
  0% { transform: scale(.96); opacity: 0; border-left-color: var(--re-brass); }
  60% { border-left-color: var(--re-brass); }
  100% { transform: scale(1); opacity: 1; border-left-color: var(--re-jade); }
}

.re-board-foot {
  margin-top: 10px; padding: 11px 12px; border-radius: 10px;
  background: #16221c; border: 1px solid var(--re-line);
  font-size: 12.5px; color: var(--re-bone-dim);
  display: flex; align-items: center; gap: 9px;
}
.re-board-foot b { color: var(--re-bone); font-weight: 600; }
.re-tick {
  width: 15px; height: 15px; flex: none; border-radius: 50%;
  border: 1.5px solid var(--re-jade); display: grid; place-items: center;
}
.re-tick::after {
  content: ""; width: 5px; height: 8px;
  border: solid var(--re-jade); border-width: 0 1.5px 1.5px 0;
  transform: rotate(43deg) translateY(-1px);
}
.re-caption {
  margin: 14px 0 0; font-size: 12.5px; color: var(--re-bone-faint);
  max-width: 40ch; line-height: 1.55;
}

.re-proof {
  margin-top: clamp(48px, 8vw, 88px);
  border-top: 1px solid var(--re-line); padding-top: 34px;
}
.re-proof-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: clamp(18px, 3vw, 34px);
}
.re-n { font-family: var(--re-mono); font-size: 11px; color: var(--re-brass-dim); letter-spacing: 0.1em; }
.re-pt h3 {
  font-family: var(--re-display); font-weight: 500; font-size: 18px;
  margin: 7px 0 5px;
}
.re-pt p { font-size: 13.5px; color: var(--re-bone-dim); margin: 0; }
.re-clients { margin: 30px 0 0; font-size: 13px; color: var(--re-bone-faint); }
.re-clients b { color: var(--re-bone-dim); font-weight: 500; }

@media (max-width: 900px) {
  .re-stage { grid-template-columns: 1fr; }
  .re-board { order: 3; margin-top: 8px; }
  .re-caption { display: none; }
  .re-proof-grid { grid-template-columns: 1fr; gap: 22px; }
  .re-now { left: 52px; }
}
@media (max-width: 460px) { .re-h1 { font-size: 33px; } }

@media (prefers-reduced-motion: reduce) {
  .re-row, .re-block, .re-ticker-anim { animation: none; opacity: 1; transform: none; }
  .re-now { animation: none; top: 46%; }
  .re-cta::after { transition: none; }
}
`;
