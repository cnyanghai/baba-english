import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  DRAMA: "剧集",
  MOVIE: "电影",
  TED: "TED",
  CARTOON: "动画",
};

export default async function DramaPage({
  params,
}: {
  params: { slug: string };
}) {
  const drama = await prisma.drama.findUnique({
    where: { slug: params.slug },
    include: {
      episodes: {
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        include: { _count: { select: { dialogues: true } } },
      },
    },
  });
  if (!drama) notFound();

  // 当前用户对各集的进度
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const progressByEpisodeId = new Map<
    number,
    { lastIdx: number; lastTimeMs: number; updatedAt: Date }
  >();
  if (userId) {
    const rows = await prisma.episodeProgress.findMany({
      where: { userId, episodeId: { in: drama.episodes.map((e) => e.id) } },
      select: { episodeId: true, lastIdx: true, lastTimeMs: true, updatedAt: true },
    });
    for (const r of rows) {
      progressByEpisodeId.set(r.episodeId, {
        lastIdx: r.lastIdx,
        lastTimeMs: r.lastTimeMs,
        updatedAt: r.updatedAt,
      });
    }
  }

  // 找最近看过的集（按 updatedAt 倒序）作为"继续学习" CTA
  const lastWatched = drama.episodes
    .filter((ep) => progressByEpisodeId.has(ep.id))
    .sort((a, b) => {
      const ta = progressByEpisodeId.get(a.id)!.updatedAt.getTime();
      const tb = progressByEpisodeId.get(b.id)!.updatedAt.getTime();
      return tb - ta;
    })[0];

  // 按季分组
  const seasons = new Map<number, typeof drama.episodes>();
  for (const ep of drama.episodes) {
    if (!seasons.has(ep.seasonNumber)) seasons.set(ep.seasonNumber, []);
    seasons.get(ep.seasonNumber)!.push(ep);
  }
  const sortedSeasons = [...seasons.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/english" className="text-sm text-muted-foreground hover:underline">
        ← 内容库
      </Link>

      <header className="mt-4 flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted sm:w-80 shrink-0">
          {drama.posterUrl ? (
            <Image
              src={drama.posterUrl}
              alt={drama.titleEn}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {TYPE_LABEL[drama.type]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {drama.titleZh ?? drama.titleEn}
          </h1>
          {drama.titleZh && drama.titleZh !== drama.titleEn && (
            <p className="mt-1 text-sm text-muted-foreground">{drama.titleEn}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5">{TYPE_LABEL[drama.type]}</span>
            {drama.year && <span>{drama.year}</span>}
            {drama.genres.length > 0 && <span>{drama.genres.join(" / ")}</span>}
            <span>{drama.episodes.length} 集</span>
          </div>
          {drama.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {drama.description}
            </p>
          )}

          {lastWatched && (
            <Button
              asChild
              size="lg"
              className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-amber-500/20"
            >
              <Link
                href={`/dramas/${drama.slug}/episodes/${lastWatched.code}/dialogues/${
                  progressByEpisodeId.get(lastWatched.id)!.lastIdx
                }`}
                className="inline-flex items-center whitespace-nowrap"
              >
                <PlayCircle className="mr-2 h-5 w-5 shrink-0" />
                <span>
                  继续学习 · S{String(lastWatched.seasonNumber).padStart(2, "0")}E
                  {String(lastWatched.episodeNumber).padStart(2, "0")} · 第{" "}
                  {progressByEpisodeId.get(lastWatched.id)!.lastIdx + 1} 句
                </span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="mt-10 space-y-8">
        {sortedSeasons.map(([season, episodes]) => (
          <section key={season}>
            <h2 className="mb-3 text-base font-semibold">第 {season} 季</h2>
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {episodes.map((ep) => {
                const prog = progressByEpisodeId.get(ep.id);
                const total = ep._count.dialogues;
                const pct =
                  prog && total > 0 ? Math.min(100, Math.round(((prog.lastIdx + 1) / total) * 100)) : 0;
                return (
                  <li key={ep.id}>
                    <Link
                      href={`/dramas/${drama.slug}/episodes/${ep.code}/dialogues/${prog?.lastIdx ?? 0}`}
                      className="group flex aspect-square flex-col items-center justify-center rounded-md border text-sm hover:bg-accent hover:text-accent-foreground transition relative overflow-hidden"
                      title={ep.title ?? ep.code}
                    >
                      <span className="font-semibold">
                        {String(ep.episodeNumber).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {prog ? `${prog.lastIdx + 1}/${total}` : `${total}句`}
                      </span>
                      {prog && (
                        <Progress
                          value={pct}
                          className="absolute bottom-0 left-0 right-0 h-1 rounded-none"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
