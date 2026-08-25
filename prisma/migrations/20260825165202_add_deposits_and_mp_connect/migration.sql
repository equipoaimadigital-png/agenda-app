-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "depositAmount" INTEGER,
ADD COLUMN     "depositPaidAt" TIMESTAMP(3),
ADD COLUMN     "depositPaymentId" TEXT;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "unsubscribeToken" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mpConnectedAccessToken" TEXT,
ADD COLUMN     "mpConnectedAt" TIMESTAMP(3),
ADD COLUMN     "mpConnectedRefreshToken" TEXT,
ADD COLUMN     "mpConnectedUserId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositAmount" INTEGER;
