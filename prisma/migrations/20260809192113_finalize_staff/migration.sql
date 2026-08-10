-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_staffId_fkey";

-- DropForeignKey
ALTER TABLE "DateException" DROP CONSTRAINT "DateException_professionalId_fkey";

-- DropIndex
DROP INDEX "Availability_professionalId_weekday_idx";

-- DropIndex
DROP INDEX "Availability_staffId_idx";

-- DropIndex
DROP INDEX "Booking_staffId_idx";

-- DropIndex
DROP INDEX "DateException_professionalId_date_key";

-- DropIndex
DROP INDEX "DateException_staffId_idx";

-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "professionalId",
ALTER COLUMN "staffId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "staffId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DateException" DROP COLUMN "professionalId",
ALTER COLUMN "staffId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Availability_staffId_weekday_idx" ON "Availability"("staffId", "weekday");

-- CreateIndex
CREATE INDEX "Booking_staffId_startTime_idx" ON "Booking"("staffId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "DateException_staffId_date_key" ON "DateException"("staffId", "date");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

