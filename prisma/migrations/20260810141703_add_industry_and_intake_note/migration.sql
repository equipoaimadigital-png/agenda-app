-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('MEDICINA', 'FITNESS', 'LOOK', 'LEY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "intakeNote" TEXT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "industry" "Industry" NOT NULL DEFAULT 'LOOK';
