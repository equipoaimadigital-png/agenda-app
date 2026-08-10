-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'SELECT');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "customAnswers" JSONB;

-- CreateTable
CREATE TABLE "ServiceField" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL DEFAULT 'TEXT',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceField_serviceId_idx" ON "ServiceField"("serviceId");

-- AddForeignKey
ALTER TABLE "ServiceField" ADD CONSTRAINT "ServiceField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
