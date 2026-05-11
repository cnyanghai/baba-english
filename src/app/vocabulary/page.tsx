import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlayCircle, PenLine } from "lucide-react";
import { VocabularyRowActions } from "@/components/VocabularyRowActions";

type Definition = { pos: string; def: string };

export default async function VocabularyPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/vocabulary");
  }

  const items = await prisma.userVocabulary.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    include: {
      word: { select: { lemma: true, ipa: true, definitions: true } },
    },
  });

  // 最近在学的集 → "继续学习"按钮
  const lastProgress = await prisma.episodeProgress.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      episode: {
        select: {
          code: true,
          seasonNumber: true,
          episodeNumber: true,
          drama: { select: { slug: true, titleZh: true, titleEn: true } },
        },
      },
    },
  });
  const continueHref = lastProgress
    ? `/dramas/${lastProgress.episode.drama.slug}/episodes/${lastProgress.episode.code}/dialogues/${lastProgress.lastIdx}`
    : null;
  const continueLabel = lastProgress
    ? `${lastProgress.episode.drama.titleZh ?? lastProgress.episode.drama.titleEn} · S${String(lastProgress.episode.seasonNumber).padStart(2, "0")}E${String(lastProgress.episode.episodeNumber).padStart(2, "0")} · 第 ${lastProgress.lastIdx + 1} 句`
    : null;

  // 来源 dialogue → episode → drama，方便回到原句子 + 按剧集分组练习入口
  const dialogueIds = items
    .map((i) => i.sourceDialogueId)
    .filter((id): id is number => id !== null);
  type DialogueInfo = {
    url: string;
    preview: string;
    dramaSlug: string;
    dramaTitleZh: string | null;
    dramaTitleEn: string;
    dramaPosterUrl: string | null;
    episodeCode: string;
    dialogueIdx: number;
  };
  const dialogueMap = new Map<number, DialogueInfo>();
  if (dialogueIds.length > 0) {
    const dialogues = await prisma.dialogue.findMany({
      where: { id: { in: dialogueIds } },
      select: {
        id: true,
        index: true,
        enText: true,
        episode: {
          select: {
            code: true,
            drama: { select: { slug: true, titleEn: true, titleZh: true, posterUrl: true } },
          },
        },
      },
    });
    for (const d of dialogues) {
      dialogueMap.set(d.id, {
        url: `/dramas/${d.episode.drama.slug}/episodes/${d.episode.code}/dialogues/${d.index}`,
        preview: d.enText,
        dramaSlug: d.episode.drama.slug,
        dramaTitleZh: d.episode.drama.titleZh,
        dramaTitleEn: d.episode.drama.titleEn,
        dramaPosterUrl: d.episode.drama.posterUrl,
        episodeCode: d.episode.code,
        dialogueIdx: d.index,
      });
    }
  }

  // 按剧集分组：每个 drama 一张卡，点击 → 该剧第一个含本剧生词的 dialogue + practice=1
  type DramaGroup = {
    slug: string;
    titleZh: string | null;
    titleEn: string;
    posterUrl: string | null;
    episodeCode: string;
    firstIdx: number;
    count: number;
  };
  const dramaGroupsMap = new Map<string, DramaGroup>();
  for (const it of items) {
    if (!it.sourceDialogueId) continue;
    const info = dialogueMap.get(it.sourceDialogueId);
    if (!info) continue;
    const existing = dramaGroupsMap.get(info.dramaSlug);
    if (existing) {
      existing.count++;
      if (info.dialogueIdx < existing.firstIdx) {
        existing.firstIdx = info.dialogueIdx;
        existing.episodeCode = info.episodeCode;
      }
    } else {
      dramaGroupsMap.set(info.dramaSlug, {
        slug: info.dramaSlug,
        titleZh: info.dramaTitleZh,
        titleEn: info.dramaTitleEn,
        posterUrl: info.dramaPosterUrl,
        episodeCode: info.episodeCode,
        firstIdx: info.dialogueIdx,
        count: 1,
      });
    }
  }
  const dramaGroups = Array.from(dramaGroupsMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {continueHref && continueLabel && (
        <Button
          asChild
          size="lg"
          className="mb-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-amber-500/20"
        >
          <Link href={continueHref} className="flex items-center justify-center gap-2">
            <PlayCircle className="h-5 w-5" />
            <span>继续学习 · {continueLabel}</span>
          </Link>
        </Button>
      )}

      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">生词本</h1>
        <span className="text-sm text-muted-foreground">{items.length} 个词</span>
      </div>

      {/* 按剧集练习入口 */}
      {dramaGroups.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <PenLine className="h-3 w-3" />
            按剧集填词练习
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {dramaGroups.map((g) => (
              <Link
                key={g.slug}
                href={`/dramas/${g.slug}/episodes/${g.episodeCode}/dialogues/${g.firstIdx}?practice=1`}
                className="group rounded-xl border bg-card p-3 hover:border-primary/40 hover:shadow-md hover:shadow-amber-500/10 transition flex items-center gap-3 active:scale-[0.98]"
              >
                <div className="h-16 w-12 shrink-0 rounded overflow-hidden bg-muted relative">
                  {g.posterUrl ? (
                    <Image
                      src={g.posterUrl}
                      alt={g.titleEn}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm font-medium truncate">
                    {g.titleZh ?? g.titleEn}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {g.count} 词 · 开始练习 →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">还没有生词</p>
          <p className="text-xs text-muted-foreground">
            播放视频时点击英文字幕里的单词 → 弹窗里点&ldquo;加入生词本&rdquo;
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => {
            const defs = (item.word.definitions ?? []) as unknown as Definition[];
            const source = item.sourceDialogueId
              ? dialogueMap.get(item.sourceDialogueId)
              : null;
            return (
              <li key={item.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-semibold">{item.word.lemma}</span>
                    {item.word.ipa && (
                      <span className="font-mono text-xs text-muted-foreground">
                        /{item.word.ipa}/
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {defs.slice(0, 3).map((d, i) => (
                      <li key={i} className="text-sm">
                        {d.pos && (
                          <span className="mr-2 inline-block min-w-[2rem] font-mono text-xs text-muted-foreground">
                            {d.pos}
                          </span>
                        )}
                        <span>{d.def}</span>
                      </li>
                    ))}
                    {defs.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        …还有 {defs.length - 3} 条释义
                      </li>
                    )}
                  </ul>
                  {source && (
                    <Link
                      href={source.url}
                      className="mt-2 block text-xs text-muted-foreground hover:text-foreground hover:underline truncate"
                      title={source.preview}
                    >
                      ← 来自：{source.preview}
                    </Link>
                  )}
                </div>
                <VocabularyRowActions wordLemma={item.word.lemma} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
