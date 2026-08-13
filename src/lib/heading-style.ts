export type HeadingFont = "FRAUNCES" | "PLAYFAIR" | "POPPINS" | "WORK_SANS";
export type HeadingSize = "SMALL" | "MEDIUM" | "LARGE";

export const HEADING_FONT_OPTIONS: { value: HeadingFont; label: string; className: string }[] = [
  { value: "FRAUNCES", label: "Clásico", className: "heading-fraunces" },
  { value: "PLAYFAIR", label: "Editorial", className: "heading-playfair" },
  { value: "POPPINS", label: "Moderno", className: "heading-poppins" },
  { value: "WORK_SANS", label: "Cercano", className: "heading-work-sans" },
];

export const HEADING_SIZE_OPTIONS: {
  value: HeadingSize;
  label: string;
  nameClass: string;
  descriptionClass: string;
}[] = [
  { value: "SMALL", label: "Chico", nameClass: "text-2xl sm:text-3xl", descriptionClass: "text-xs sm:text-sm" },
  { value: "MEDIUM", label: "Mediano", nameClass: "text-3xl sm:text-4xl", descriptionClass: "text-sm sm:text-base" },
  { value: "LARGE", label: "Grande", nameClass: "text-4xl sm:text-5xl", descriptionClass: "text-base sm:text-lg" },
];

export function headingFontClassName(font: HeadingFont): string {
  return HEADING_FONT_OPTIONS.find((o) => o.value === font)?.className ?? "heading-fraunces";
}

export function headingSizeClasses(size: HeadingSize): { nameClass: string; descriptionClass: string } {
  const opt = HEADING_SIZE_OPTIONS.find((o) => o.value === size) ?? HEADING_SIZE_OPTIONS[1];
  return { nameClass: opt.nameClass, descriptionClass: opt.descriptionClass };
}
