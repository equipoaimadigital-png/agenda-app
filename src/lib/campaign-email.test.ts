import { describe, expect, it } from "vitest";
import { renderCampaignEmail, type CampaignBranding } from "./email";

const base: CampaignBranding = {
  businessName: "Tú agenda",
  tagline: "Agenda tu hora en línea.",
  brandColor: "#683ccd",
  coverImageUrl: "https://cdn.example.com/negocio/cover.jpg?v=1",
  includeCover: true,
  bookingUrl: "https://tuhoralista.com/reservar/tu-agenda",
  instagramUrl: "https://instagram.com/negocio",
  facebookUrl: null,
  whatsappUrl: "https://wa.me/56999999999",
  mapsUrl: null,
};

const render = (b: Partial<CampaignBranding>) =>
  renderCampaignEmail({
    branding: { ...base, ...b },
    bodyHtml: "Hola <strong>María</strong>,<br/><br/>Promo esta semana.",
    footerNoteHtml: "Recibiste esto porque eres cliente.",
  });

describe("renderCampaignEmail", () => {
  it("incluye el nombre del negocio, el cuerpo y el botón hacia la URL de reserva", () => {
    const html = render({});
    expect(html).toContain("Tú agenda");
    expect(html).toContain("Promo esta semana.");
    expect(html).toContain('href="https://tuhoralista.com/reservar/tu-agenda"');
    expect(html).toContain("Reservar ahora");
    expect(html).toContain("Enviado con Tu Hora Lista");
  });

  it("usa el color de marca en la cabecera y el botón", () => {
    expect(render({}).match(/#683ccd/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("descarta un color de marca que no sea #rrggbb (cae al color por defecto)", () => {
    const html = render({ brandColor: "red; } body { display:none" });
    expect(html).not.toContain("display:none");
    expect(html).toContain("#2f4a3e");
  });

  it("con includeCover pone la imagen; sin includeCover no", () => {
    expect(render({ includeCover: true })).toContain("<img src=");
    expect(render({ includeCover: false })).not.toContain("<img src=");
  });

  it("ignora una portada que no sea https (los clientes de correo bloquean http)", () => {
    expect(render({ coverImageUrl: "http://inseguro.com/x.jpg" })).not.toContain("<img src=");
  });

  it("solo muestra los chips de redes que existen", () => {
    const html = render({});
    expect(html).toContain(">Instagram<");
    expect(html).toContain(">WhatsApp<");
    expect(html).not.toContain(">Facebook<");
    expect(html).not.toContain(">Cómo llegar<");
  });

  it("escapa comillas y ángulos en el nombre del negocio", () => {
    const html = render({ businessName: 'Rulos "<script>" & Co' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;");
    expect(html).toContain("&amp;");
  });

  it("si no hay ninguna red social, no renderiza la fila 'Síguenos'", () => {
    const html = render({ instagramUrl: null, facebookUrl: null, whatsappUrl: null, mapsUrl: null });
    expect(html).not.toContain("Síguenos");
  });
});
