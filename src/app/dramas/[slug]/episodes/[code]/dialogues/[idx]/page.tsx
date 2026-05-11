import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DialoguePlayer } from "@/components/DialoguePlayer";

type PageProps = {
  params: { slug: string; code: string; idx: string };
  searchParams: { practice?: string };
};

export default async function DialoguePage({ params, searchParams }: PageProps) {
  const initialPractice = searchParams.practice === "1";
  const idx = Number.parseInt(params.idx, 10);
  if (!Number.isFinite(idx) || idx < 0) notFound();

  const episode = await prisma.episode.findFirst({
    where: { code: params.code, drama: { slug: params.slug } },
    include: { drama: true },
  });
  if (!episode) notFound();

  // 一次性加载本集所有句子（连播模式需要客户端按时间检索）
  const dialogues = await prisma.dialogue.findMany({
    where: { episodeId: episode.id },
    orderBy: { index: "asc" },
    select: {
      id: true,
      index: true,
      startMs: true,
      endMs: true,
      enText: true,
      zhText: true,
    },
  });

  if (idx >= dialogues.length) notFound();

  // 加载用户生词（生词标记 + 填词模式都用）+ 付费状态（用于试看墙）
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const vocabSentenceIdx: number[] = [];
  // 每个 lemma 对应它出现的所有句子 idx —— 用于练习模式 round-robin 轮询
  const vocabIdxByLemma: Record<string, number[]> = {};
  let vocabLemmas: string[] = [];
  const vocabDefByLemma: Record<string, string> = {};
  let isPaid = false;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { paidUntil: true },
    });
    isPaid = !!(u?.paidUntil && u.paidUntil > new Date());
  }
  if (userId) {
    const vocab = await prisma.userVocabulary.findMany({
      where: { userId },
      include: { word: { select: { lemma: true, definitions: true } } },
    });
    vocabLemmas = vocab.map((v) => v.wordLemma);
    for (const v of vocab) {
      const defs = (v.word.definitions ?? []) as Array<{ pos: string; def: string }>;
      const first = defs[0];
      if (first) {
        vocabDefByLemma[v.wordLemma.toLowerCase()] =
          (first.pos ? first.pos + " " : "") + first.def;
      }
    }
    const vocabSet = new Set(vocabLemmas.map((l) => l.toLowerCase()));
    for (const l of vocabSet) vocabIdxByLemma[l] = [];
    if (vocabSet.size > 0) {
      const wordRe = /[a-zA-Z]+(?:['-][a-zA-Z]+)*/g;
      for (const d of dialogues) {
        const tokens = d.enText.toLowerCase().match(wordRe) ?? [];
        const lemmasHere = new Set<string>();
        for (const t of tokens) if (vocabSet.has(t)) lemmasHere.add(t);
        if (lemmasHere.size > 0) {
          vocabSentenceIdx.push(d.index);
          for (const l of lemmasHere) vocabIdxByLemma[l].push(d.index);
        }
      }
    }
  }

  const baseHref = `/dramas/${params.slug}/episodes/${params.code}/dialogues`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <Link href={`/dramas/${params.slug}`} className="hover:underline">
          ← {episode.drama.titleZh ?? episode.drama.titleEn}
        </Link>
        <span>
          第 {episode.seasonNumber} 季第 {String(episode.episodeNumber).padStart(2, "0")} 集
        </span>
      </div>

      <DialoguePlayer
        videoUrl={episode.videoUrl}
        dialogues={dialogues}
        initialIdx={idx}
        baseHref={baseHref}
        episodeId={episode.id}
        vocabSentenceIdx={vocabSentenceIdx}
        vocabIdxByLemma={vocabIdxByLemma}
        vocabLemmas={vocabLemmas}
        vocabDefByLemma={vocabDefByLemma}
        isPaid={isPaid}
        initialPractice={initialPractice}
      />
    </div>
  );
}
