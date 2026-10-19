-- 研习录并入 Baba：两张新表（和 prisma/schema.prisma 里的 YxlDoc、YxlFile 一致）
-- 幂等：可以重复执行。按交接简报的规矩，不用 prisma db push / migrate deploy，直接 psql：
--   docker exec -i baba-pg psql -U baba -d baba_english -v ON_ERROR_STOP=1 < schema.sql
BEGIN;

CREATE TABLE IF NOT EXISTS "YxlDoc" (
    "userId" TEXT NOT NULL,
    "coll" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YxlDoc_pkey" PRIMARY KEY ("userId","coll","docId")
);

CREATE TABLE IF NOT EXISTS "YxlFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YxlFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "YxlDoc_userId_updatedAt_idx" ON "YxlDoc"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "YxlFile_userId_idx" ON "YxlFile"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'YxlDoc_userId_fkey') THEN
    ALTER TABLE "YxlDoc" ADD CONSTRAINT "YxlDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'YxlFile_userId_fkey') THEN
    ALTER TABLE "YxlFile" ADD CONSTRAINT "YxlFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
