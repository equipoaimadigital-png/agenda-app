-- Bloqueo parcial de día: rango horario opcional. NULL/NULL = día completo.
ALTER TABLE "DateException" ADD COLUMN "startMin" INTEGER;
ALTER TABLE "DateException" ADD COLUMN "endMin" INTEGER;
