/**
 * "El Sello" — motivo de marca del sistema de diseño: doble anillo en bronce.
 * Es SIEMPRE refuerzo visual, nunca el único portador del mensaje — el texto
 * explícito que lo acompaña es lo que realmente comunica el estado.
 */
export function Seal({
  size = 56,
  className = "",
  children,
}: {
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={`relative shrink-0 rounded-full flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size / 24)}px solid var(--brass)`,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: Math.max(3, size / 12),
          border: `${Math.max(1, size / 48)}px solid var(--brass)`,
        }}
      />
      {children}
    </div>
  );
}
