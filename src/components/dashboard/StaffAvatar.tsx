/** Iniciales de un nombre: 2 letras (primera + última palabra) o 2 del único término. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Foto redonda de un profesional. Sin `photoUrl` muestra un círculo con las
 * iniciales sobre su color de agenda. Componente puro — se usa tanto en el
 * panel como en la página pública de reservas.
 */
export function StaffAvatar({
  name,
  color,
  photoUrl,
  size = 44,
}: {
  name: string;
  color: string;
  photoUrl: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className="rounded-full object-cover shrink-0 border border-black/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="rounded-full shrink-0 flex items-center justify-center font-semibold text-white border border-black/10"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initialsOf(name)}
    </span>
  );
}
