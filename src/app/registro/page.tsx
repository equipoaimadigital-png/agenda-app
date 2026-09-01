import type { Metadata } from "next";
import { RegisterExperience } from "@/components/auth/RegisterExperience";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description:
    "Tu agenda se llena mientras tú atiendes. Tus clientes reservan solos desde un link, con recordatorios automáticos. Prueba gratis 10 días, sin tarjeta.",
};

export default function RegistroPage() {
  return <RegisterExperience />;
}
