import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { HeroVideoBackdrop } from "@/components/HeroVideoBackdrop";
import { PlayCircle } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  DRAMA: "剧集",
  MOVIE: "电影",
  TED: "TED",
  CARTOON: "动画",
};

export default async function HomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [dramas, lastProgress] = await Promise.all([
    prisma.drama.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { episodes: true } } },
    }),
    userId
      ? prisma.episodeProgress.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          include: {
            episode: {
              include: {
                drama: { select: { slug: true, titleZh: true, titleEn: true } },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const continueHref = lastProgress
    ? `/dramas/${lastProgress.episode.drama.slug}/episodes/${lastProgress.episode.code}/dialogues/${lastProgress.lastIdx}`
    : "/dramas/friends/episodes/S01E01/dialogues/0";

  const heroBackdrop = dramas.find((d) => d.posterUrl);
  const continueLabel = lastProgress
    ? `继续 ${lastProgress.episode.drama.titleZh ?? lastProgress.episode.drama.titleEn}`
    : "打开演示";

  return (
    <div>
      {/* ─── Hero：单焦点 + 单 CTA + 活视频背景 ─── */}
      <section className="relative isolate overflow-hidden min-h-[70vh] flex items-center">
        <HeroVideoBackdrop
          videoSrc="https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev/hero/loop.mp4"
          fallbackPoster={heroBackdrop?.posterUrl ?? null}
        />

        <div className="mx-auto max-w-5xl px-6 w-full">
          <p className="text-[10px] font-mono tracking-[0.4em] text-amber-500/70 uppercase mb-6">
            Baba · for English Learners
          </p>
          <h1 className="text-5xl sm:text-7xl leading-[1.1] tracking-tight max-w-3xl">
            <span className="font-serif font-medium block">今晚我们看</span>
            <span className="font-display font-bold block text-amber-500 my-2 sm:my-3 whitespace-nowrap">
              Harry Potter
            </span>
            <span className="font-serif font-medium block">明早你听懂它</span>
          </h1>

          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-amber-500/30 transition-transform active:scale-[0.97]"
            >
              <Link href={continueHref} className="inline-flex items-center whitespace-nowrap">
                <PlayCircle className="mr-2 h-5 w-5 shrink-0" />
                <span>{continueLabel}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/50 text-xs font-mono tracking-widest">
          ↓
        </div>
      </section>

      {/* ─── 内容库：海报为艺术品 ─── */}
      <section id="library" className="mx-auto max-w-5xl px-6 pt-8 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-serif text-2xl font-medium tracking-tight">你的故事书</h2>
          <span className="text-xs text-muted-foreground tabular-nums font-mono">
            {dramas.length} / 计划 700+
          </span>
        </div>

        {dramas.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <p className="text-sm text-muted-foreground">内容库构建中…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
            {dramas.map((d) => (
              <Link
                key={d.slug}
                href={`/dramas/${d.slug}`}
                className="group block transition-transform duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border/40 shadow-lg shadow-black/30 transition-shadow group-hover:shadow-2xl group-hover:shadow-amber-500/20">
                  {d.posterUrl ? (
                    <Image
                      src={d.posterUrl}
                      alt={d.titleEn}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
                      {TYPE_LABEL[d.type] ?? "内容"}
                    </div>
                  )}
                </div>
                {/* 文字独立在卡片之外（强制单行避免错位） */}
                <div className="mt-3 px-0.5">
                  <h3 className="font-serif text-sm font-medium tracking-tight truncate">
                    {d.titleZh ?? d.titleEn}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums font-mono truncate">
                    {d.titleEn !== (d.titleZh ?? d.titleEn) ? d.titleEn : ""}
                    {d.year ? `${d.titleEn !== (d.titleZh ?? d.titleEn) ? " · " : ""}${d.year}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
