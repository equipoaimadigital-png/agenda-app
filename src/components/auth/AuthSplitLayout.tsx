const TRUST_ITEMS = ["Sin tarjeta de crédito", "10 días gratis", "Cancela cuando quieras"];

// Mundo visual compartido con /registro ("pizarra de citas de noche").
const GROUND = "#14211b";
const BONE = "#f3efe4";
const BONE_DIM = "#afa996";
const BRASS = "#c99a4e";
const BRASS_DIM = "#8a6c3c";
const JADE = "#82b6a0";
const LINE = "#2c3f34";

// Filas de una agenda estilizada — el mismo motivo del panel derecho de
// /registro, aquí como textura de fondo tenue (un motivo, no un patrón).
const MOTIF_ROWS = [
  { t: "09:00", filled: true },
  { t: "10:00", filled: false },
  { t: "11:00", filled: true },
  { t: "12:00", filled: true },
  { t: "13:00", filled: false },
  { t: "14:00", filled: true },
];

export function AuthSplitLayout({
  tagline,
  trust = true,
  children,
}: {
  tagline: string;
  trust?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-paper">
      {/* Portada */}
      <div
        className="relative px-6 py-8 md:w-2/5 md:min-h-screen md:flex md:flex-col md:justify-between md:py-12 overflow-hidden"
        style={{
          color: BONE,
          background: GROUND,
          backgroundImage: `radial-gradient(120% 80% at 15% 0%, #1d3128 0%, ${GROUND} 62%)`,
        }}
      >
        {/* Resplandor cálido en latón */}
        <div
          aria-hidden
          className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, ${BRASS}29 0%, transparent 70%)` }}
        />

        {/* Motivo: agenda estilizada, muy tenue */}
        <div
          aria-hidden
          className="hidden md:block absolute right-6 bottom-10 w-[260px] opacity-40"
        >
          {MOTIF_ROWS.map((r) => (
            <div key={r.t} className="flex items-center gap-3 py-2.5" style={{ borderTop: `1px solid ${LINE}` }}>
              <span className="font-mono text-[10px]" style={{ color: BRASS_DIM }}>
                {r.t}
              </span>
              <span
                className="h-3 flex-1 rounded-[4px]"
                style={{
                  background: r.filled ? "#26392f" : "transparent",
                  borderLeft: r.filled ? `2px solid ${JADE}` : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Marca */}
        <div className="relative flex items-center gap-2.5 md:block">
          <span
            aria-hidden
            className="w-2 h-2 rounded-full md:mb-4 inline-block"
            style={{ background: BRASS, boxShadow: `0 0 0 4px ${BRASS}22` }}
          />
          <span className="font-display font-semibold text-xl tracking-tight">Tu Hora Lista</span>
        </div>

        <div className="relative">
          <p className="hidden md:block font-display text-[26px] leading-snug max-w-xs text-balance">
            {tagline}
          </p>

          {trust && (
            <ul className="hidden md:flex flex-col gap-2.5 mt-8">
              {TRUST_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-[13px]"
                  style={{ color: BONE_DIM }}
                >
                  <span
                    aria-hidden
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0"
                    style={{ border: `1px solid ${JADE}`, color: JADE }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p
          className="relative hidden md:block font-mono text-[10.5px] tracking-[0.16em] uppercase"
          style={{ color: BRASS }}
        >
          Agenda online · Chile
        </p>
      </div>

      {/* Panel del formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">{children}</div>
        <p className="text-xs text-muted text-center mt-8">
          © {new Date().getFullYear()} Tu Hora Lista, una plataforma de AIMA Digital. Todos los
          derechos reservados.
        </p>
      </div>
    </main>
  );
}
