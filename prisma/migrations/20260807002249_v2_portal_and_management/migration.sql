-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "manageToken" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "address" TEXT,
ADD COLUMN     "brandColor" TEXT NOT NULL DEFAULT '#0f766e',
ADD COLUMN     "cancellationHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "DateException" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateException_professionalId_date_key" ON "DateException"("professionalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_manageToken_key" ON "Booking"("manageToken");

-- AddForeignKey
ALTER TABLE "DateException" ADD CONSTRAINT "DateException_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

