-- CreateEnum
CREATE TYPE "CampaignAudience" AS ENUM ('ALL', 'INACTIVE_30D');

-- AlterTable Client
ALTER TABLE "Client" ADD COLUMN "unsubscribed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN "unsubscribeToken" TEXT NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "Client_unsubscribeToken_key" ON "Client"("unsubscribeToken");

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "CampaignAudience" NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailCampaign_professionalId_createdAt_idx" ON "EmailCampaign"("professionalId", "createdAt");

ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: toda tabla nueva debe quedar protegida de la API publica de Supabase
ALTER TABLE "EmailCampaign" ENABLE ROW LEVEL SECURITY;
