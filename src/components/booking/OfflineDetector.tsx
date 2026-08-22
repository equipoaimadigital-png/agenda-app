"use client";

import { useEffect, useState } from "react";

export function OfflineDetector() {
  // Lee el estado real al inicializar en vez de asumir "true" y corregirlo en
  // un efecto — evita un re-render extra apenas montado y el parpadeo que eso
  // produce si el usuario ya está sin conexión.
  //
  // OJO: se comprueba "typeof window", no "typeof navigator". Desde Node 21,
  // el runtime de servidor expone un `navigator` global propio (sin
  // `.onLine`) para compatibilidad con APIs web — con el chequeo de
  // "navigator" el SSR entraba a la rama del navegador, leía
  // `navigator.onLine` como `undefined` (falsy) y mandaba el banner de "sin
  // conexión" en el HTML de CADA visita, a todos los clientes. "window" sí es
  // exclusivo del navegador real.
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-danger text-white px-4 py-3 text-center text-sm font-medium z-50">
      ⚠️ Sin conexión — reconectando...
    </div>
  );
}
