-- CreateEnum
CREATE TYPE "HeadingFont" AS ENUM ('FRAUNCES', 'PLAYFAIR', 'POPPINS', 'WORK_SANS');

-- CreateEnum
CREATE TYPE "HeadingSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "headingFont" "HeadingFont" NOT NULL DEFAULT 'FRAUNCES',
ADD COLUMN     "headingSize" "HeadingSize" NOT NULL DEFAULT 'MEDIUM';
