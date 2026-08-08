import { Seal } from "@/components/ui/Seal";

export function AuthSplitLayout({
  tagline,
  children,
}: {
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-paper">
      {/* Panel de marca */}
      <div className="relative bg-ink text-white px-6 py-8 md:w-2/5 md:min-h-screen md:flex md:flex-col md:justify-between md:py-12 overflow-hidden">
        <div aria-hidden className="absolute inset-0 seal-texture" />
        <div className="relative flex items-center gap-3 md:block">
          <Seal size={40} />
          <p className="font-display text-2xl md:mt-4">Agenda</p>
        </div>
        <p className="relative hidden md:block text-white/70 max-w-xs mt-6">
          {tagline}
        </p>
      </div>

      {/* Panel del formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
