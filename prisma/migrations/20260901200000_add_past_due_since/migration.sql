-- Período de gracia cuando el cobro recurrente falla.
ALTER TABLE "Professional" ADD COLUMN "pastDueSince" TIMESTAMP(3);
