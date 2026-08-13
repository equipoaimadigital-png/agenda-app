export type ServicePriceType = "FIXED" | "FROM" | "QUOTE";

export function formatServicePrice(
  price: number | null,
  priceType: ServicePriceType
): string | null {
  if (priceType === "QUOTE") return "A cotizar";
  if (price == null) return null;
  const amount = `$${price.toLocaleString("es-CL")}`;
  return priceType === "FROM" ? `Desde ${amount}` : amount;
}
