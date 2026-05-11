-- CreateTable
CREATE TABLE "WordEtymology" (
    "lemma" TEXT NOT NULL,
    "pos" TEXT,
    "etymology" TEXT NOT NULL,
    "years" INTEGER[],
    "crossrefs" TEXT[],

    CONSTRAINT "WordEtymology_pkey" PRIMARY KEY ("lemma")
);
