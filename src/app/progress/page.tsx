import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, BookMarked, PlayCircle } from "lucide-react";

function fmtDuration(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)} 秒`;
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} 分钟`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function fmtRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return date.toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/progress");
  }

  const [progressList, vocabCount, totalSummary] = await Promise.all([
    prisma.episodeProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        episode: {
          include: {
            drama: { select: { slug: true, titleEn: true, titleZh: true, posterUrl: true } },
            _count: { select: { dialogues: true } },
          },
        },
      },
    }),
    prisma.userVocabulary.count({ where: { userId } }),
    prisma.episodeProgress.aggregate({
      where: { userId },
      _sum: { totalWatchedMs: true },
    }),
  ]);

  const totalWatchedMs = totalSummary._sum.totalWatchedMs ?? 0;
  const episodesTouched = progressList.length;
  const lastWatched = progressList[0] ?? null;

  // 已学完比例：lastIdx+1 == 总句数 算完成
  const finishedCount = progressList.filter(
    (p) => p.lastIdx + 1 >= p.episode._count.dialogues,
  ).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">学习进度</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {session?.user?.name ?? session?.user?.email} · 累计学习数据
      </p>

      {/* 三大数字卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Clock className="h-4 w-4" />
            累计观看时长
          </div>
          <div className="text-3xl font-bold tabular-nums">{fmtDuration(totalWatchedMs)}</div>
        </div>
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <BookOpen className="h-4 w-4" />
            已学集数
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {episodesTouched}
            {finishedCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                完成 {finishedCount}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <BookMarked className="h-4 w-4" />
            生词本
          </div>
          <div className="text-3xl font-bold tabular-nums">{vocabCount}</div>
        </div>
      </div>

      {/* 继续学习 CTA */}
      {lastWatched && (
        <Button
          asChild
          size="lg"
          className="w-full mb-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-amber-500/20"
        >
          <Link
            href={`/dramas/${lastWatched.episode.drama.slug}/episodes/${lastWatched.episode.code}/dialogues/${lastWatched.lastIdx}`}
            className="flex items-center justify-center gap-2"
          >
            <PlayCircle className="h-5 w-5" />
            <span>
              继续学习 ·{" "}
              {lastWatched.episode.drama.titleZh ?? lastWatched.episode.drama.titleEn} · S
              {String(lastWatched.episode.seasonNumber).padStart(2, "0")}E
              {String(lastWatched.episode.episodeNumber).padStart(2, "0")} · 第{" "}
              {lastWatched.lastIdx + 1} 句
            </span>
          </Link>
        </Button>
      )}

      {/* 最近活动 */}
      <h2 className="text-lg font-semibold mb-3">最近学习</h2>
      {progressList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">还没有学习记录</p>
          <Button asChild>
            <Link href="/english">去内容库开始学习</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {progressList.map((p) => {
            const total = p.episode._count.dialogues;
            const pct = total > 0 ? Math.min(100, Math.round(((p.lastIdx + 1) / total) * 100)) : 0;
            const finished = p.lastIdx + 1 >= total;
            return (
              <li key={p.id}>
                <Link
                  href={`/dramas/${p.episode.drama.slug}/episodes/${p.episode.code}/dialogues/${p.lastIdx}`}
                  className="block p-4 hover:bg-accent transition"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold flex-1 truncate">
                      {p.episode.drama.titleZh ?? p.episode.drama.titleEn} · S
                      {String(p.episode.seasonNumber).padStart(2, "0")}E
                      {String(p.episode.episodeNumber).padStart(2, "0")}
                    </span>
                    {finished && (
                      <span className="text-[10px] rounded bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">
                        完成
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {fmtRelative(p.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {p.lastIdx + 1} / {total}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {fmtDuration(p.totalWatchedMs)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
