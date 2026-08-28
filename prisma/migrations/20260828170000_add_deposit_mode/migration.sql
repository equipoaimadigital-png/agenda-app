-- CreateEnum
CREATE TYPE "DepositMode" AS ENUM ('NONE', 'OPTIONAL', 'REQUIRED');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositMode" "DepositMode" NOT NULL DEFAULT 'NONE';

-- Los servicios que ya tenían un monto de depósito venían comportándose como
-- obligatorio; se preserva ese comportamiento al introducir el modo.
UPDATE "Service" SET "depositMode" = 'REQUIRED' WHERE "depositAmount" IS NOT NULL;
