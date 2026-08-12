-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthday" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_professionalId_phone_key" ON "Client"("professionalId", "phone");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Toda tabla nueva necesita RLS activado, si no queda expuesta por la API
-- publica de Supabase (ver migracion 20260810212855_enable_row_level_security).
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
