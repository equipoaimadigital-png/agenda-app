import { Seal } from "@/components/ui/Seal";

const TRUST_ITEMS = ["Sin tarjeta de crédito", "14 días gratis", "Cancela cuando quieras"];

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
      {/* Panel de marca */}
      <div className="relative bg-ink text-white px-6 py-8 md:w-2/5 md:min-h-screen md:flex md:flex-col md:justify-between md:py-12 overflow-hidden">
        {/* Resplandor sutil + un solo anillo grande — un motivo, no un patrón repetido */}
        <div
          aria-hidden
          className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brass) 20%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="hidden md:block absolute -bottom-32 -right-32 opacity-[0.14]">
          <Seal size={340} />
        </div>

        <div className="relative flex items-center gap-3 md:block">
          <Seal size={36} />
          <p className="font-display font-semibold text-2xl md:mt-5 tracking-tight">Tú Agenda</p>
        </div>

        <div className="relative">
          <p className="hidden md:block font-display text-2xl leading-snug max-w-xs text-balance">
            {tagline}
          </p>

          {trust && (
            <ul className="hidden md:flex flex-col gap-2 mt-8 text-sm text-white/70">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-brass shrink-0"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
