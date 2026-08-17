/** WCAG contraste — usado para validar que --brand siga siendo legible con texto blanco. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [lr, lg, lb] = [r, g, b].map(linear);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [la, lb] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (la + 0.05) / (lb + 0.05);
}
