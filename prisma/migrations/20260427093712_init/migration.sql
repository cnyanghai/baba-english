-- CreateEnum
CREATE TYPE "DramaType" AS ENUM ('DRAMA', 'MOVIE', 'TED', 'CARTOON');

-- CreateTable
CREATE TABLE "Drama" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DramaType" NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT,
    "posterUrl" TEXT,
    "description" TEXT,
    "genres" TEXT[],
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "dramaId" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL DEFAULT 1,
    "episodeNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "videoUrl" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dialogue" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "enText" TEXT NOT NULL,
    "zhText" TEXT,
    "clipUrl" TEXT,

    CONSTRAINT "Dialogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "lemma" TEXT NOT NULL,
    "ipa" TEXT,
    "definitions" JSONB NOT NULL,
    "audioUrl" TEXT,
    "freq" INTEGER,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("lemma")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVocabulary" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "wordLemma" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceDialogueId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "UserVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drama_slug_key" ON "Drama"("slug");

-- CreateIndex
CREATE INDEX "Drama_type_idx" ON "Drama"("type");

-- CreateIndex
CREATE INDEX "Episode_dramaId_seasonNumber_episodeNumber_idx" ON "Episode"("dramaId", "seasonNumber", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_dramaId_code_key" ON "Episode"("dramaId", "code");

-- CreateIndex
CREATE INDEX "Dialogue_episodeId_idx" ON "Dialogue"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Dialogue_episodeId_index_key" ON "Dialogue"("episodeId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserVocabulary_userId_idx" ON "UserVocabulary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabulary_userId_wordLemma_key" ON "UserVocabulary"("userId", "wordLemma");

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_dramaId_fkey" FOREIGN KEY ("dramaId") REFERENCES "Drama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dialogue" ADD CONSTRAINT "Dialogue_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabulary" ADD CONSTRAINT "UserVocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabulary" ADD CONSTRAINT "UserVocabulary_wordLemma_fkey" FOREIGN KEY ("wordLemma") REFERENCES "Word"("lemma") ON DELETE RESTRICT ON UPDATE CASCADE;
