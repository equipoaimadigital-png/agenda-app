-- Revierte el sistema de "rubro" (Industry): el profesional pidió sacarlo
-- porque su único efecto visible le pareció ser el color, sin justificar la
-- complejidad de mantener 4 paneles distintos. Las preguntas personalizadas
-- por servicio (ServiceField / Booking.customAnswers) NO se tocan — son
-- independientes y siguen funcionando igual.

ALTER TABLE "Professional" DROP COLUMN "industry";
ALTER TABLE "Booking" DROP COLUMN "intakeNote";
DROP TYPE "Industry";
