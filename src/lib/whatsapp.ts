export function buildWhatsappLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
