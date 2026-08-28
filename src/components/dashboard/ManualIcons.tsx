// Set de íconos propios (SVG, trazo, sin librería externa) para el Manual de
// uso — mismo lenguaje visual "El Sello" del resto de la app: trazos finos,
// esquinas suaves, color heredado vía currentColor.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return base(
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 16.5h2M11 16.5h2" />
    </>,
    props
  );
}

export function IconUsers(props: IconProps) {
  return base(
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M15.5 14.2c2.3.4 3.9 2 3.9 4.3" />
    </>,
    props
  );
}

export function IconMegaphone(props: IconProps) {
  return base(
    <>
      <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H7l2.7 3.8c.5.7 1.6.4 1.6-.5v-13c0-.9-1.1-1.2-1.6-.5L7 8.5H5.5A1.5 1.5 0 0 0 4 10Z" />
      <path d="M11.3 6 18 4v13l-6.7-2" />
      <path d="M18 8.5c1.4.3 2.5 1.3 2.5 2.5S19.4 13.2 18 13.5" />
    </>,
    props
  );
}

export function IconClipboard(props: IconProps) {
  return base(
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" />
    </>,
    props
  );
}

export function IconClock(props: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3 2" />
    </>,
    props
  );
}

export function IconChart(props: IconProps) {
  return base(
    <>
      <path d="M4 20V9M9.5 20V4M15 20v-7M20 20v-4" />
      <path d="M3.5 20h17" />
    </>,
    props
  );
}

export function IconGear(props: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
    </>,
    props
  );
}

export function IconCard(props: IconProps) {
  return base(
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M7 14.5h4" />
    </>,
    props
  );
}

export function IconBook(props: IconProps) {
  return base(
    <>
      <path d="M4 5.5c1.6-.9 3.6-1.2 5.5-.7 1 .3 1.9.8 2.5 1.5v13.2c-.6-.6-1.5-1.1-2.5-1.4-1.9-.5-3.9-.2-5.5.7Z" />
      <path d="M20 5.5c-1.6-.9-3.6-1.2-5.5-.7-1 .3-1.9.8-2.5 1.5v13.2c.6-.6 1.5-1.1 2.5-1.4 1.9-.5 3.9-.2 5.5.7Z" />
    </>,
    props
  );
}

export function IconHelp(props: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .9-1 1.7" />
      <circle cx="12" cy="16.3" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function IconWallet(props: IconProps) {
  return base(
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H16a1 1 0 0 1 1 1v1" />
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.5" />
      <path d="M20.5 12.5H16.5a2 2 0 0 0 0 4h4" />
      <circle cx="16.4" cy="14.5" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function IconSearch(props: IconProps) {
  return base(
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m20 20-4.3-4.3" />
    </>,
    props
  );
}

export function IconUserCircle(props: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="10" r="2.8" />
      <path d="M6.5 18.5c1.1-2.2 3.1-3.4 5.5-3.4s4.4 1.2 5.5 3.4" />
    </>,
    props
  );
}
