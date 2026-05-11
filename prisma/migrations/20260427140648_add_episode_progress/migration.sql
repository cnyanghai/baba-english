-- CreateTable
CREATE TABLE "EpisodeProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "lastIdx" INTEGER NOT NULL DEFAULT 0,
    "lastTimeMs" INTEGER NOT NULL DEFAULT 0,
    "totalWatchedMs" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpisodeProgress_userId_idx" ON "EpisodeProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeProgress_userId_episodeId_key" ON "EpisodeProgress"("userId", "episodeId");

-- AddForeignKey
ALTER TABLE "EpisodeProgress" ADD CONSTRAINT "EpisodeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeProgress" ADD CONSTRAINT "EpisodeProgress_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
