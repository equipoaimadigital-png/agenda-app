-- CreateEnum
CREATE TYPE "ServicePriceType" AS ENUM ('FIXED', 'FROM', 'QUOTE');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "priceType" "ServicePriceType" NOT NULL DEFAULT 'FIXED';
