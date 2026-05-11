import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Crown, BookMarked, BarChart3, Sparkles, PlayCircle, LogOut } from "lucide-react";

function fmtPhone(p: string | null | undefined): string {
  if (!p) return "—";
  if (p.length === 11) return `${p.slice(0, 3)} ${p.slice(3, 7)} ${p.slice(7)}`;
  return p;
}

function fmtMinutes(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} 分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} 小时` : `${h}h ${m}m`;
}

function fmtJoinDate(d: Date): string {
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
}

export default async function AccountPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?callbackUrl=/account");

  const [user, vocabCount, progressAgg, lastProgress] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userVocabulary.count({ where: { userId } }),
    prisma.episodeProgress.aggregate({
      where: { userId },
      _sum: { totalWatchedMs: true, lastIdx: true },
    }),
    prisma.episodeProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        episode: {
          select: {
            code: true,
            drama: { select: { slug: true, titleZh: true, titleEn: true } },
          },
        },
      },
    }),
  ]);

  if (!user) redirect("/login");

  const isPaid = !!(user.paidUntil && user.paidUntil > new Date());
  const daysLeft = isPaid
    ? Math.ceil(((user.paidUntil as Date).getTime() - Date.now()) / 86_400_000)
    : 0;
  const watchedMs = progressAgg._sum.totalWatchedMs ?? 0;
  const sentencesProgressed = progressAgg._sum.lastIdx ?? 0;
  const phoneTail = user.phone?.slice(-2) ?? "··";
  const continueHref = lastProgress
    ? `/dramas/${lastProgress.episode.drama.slug}/episodes/${lastProgress.episode.code}/dialogues/${lastProgress.lastIdx}`
    : null;
  const continueLabel = lastProgress
    ? `${lastProgress.episode.drama.titleZh ?? lastProgress.episode.drama.titleEn} · 第 ${lastProgress.lastIdx + 1} 句`
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 space-y-6">
      {/* ── Hero：身份 + 会员状态 ────────── */}
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/40">
          <span className="font-serif text-3xl font-medium text-black/85 tabular-nums">
            {phoneTail}
          </span>
        </div>
        <p className="font-serif text-2xl font-medium tracking-tight tabular-nums">
          {fmtPhone(user.phone)}
        </p>
        <p className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          加入于 {fmtJoinDate(user.createdAt)}
        </p>

        {/* 会员徽章 */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
          {isPaid ? (
            <>
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Baba 会员</span>
              <span className="text-xs text-muted-foreground tabular-nums font-mono">
                · 至 {(user.paidUntil as Date).toLocaleDateString("zh-CN")} · {daysLeft} 天
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">试用中 · 视频前 10 分钟免费</span>
            </>
          )}
        </div>
      </section>

      {/* ── 学习统计 ───────────────────── */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="font-serif text-3xl font-medium tabular-nums">{vocabCount}</p>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">生词</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="font-serif text-3xl font-medium tabular-nums">{fmtMinutes(watchedMs)}</p>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">观看时长</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="font-serif text-3xl font-medium tabular-nums">{sentencesProgressed}</p>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">学过句子</p>
        </div>
      </section>

      {/* ── 继续学习（如果有进度） ──────── */}
      {continueHref && continueLabel && (
        <Link
          href={continueHref}
          className="group flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4 transition hover:border-primary/50 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.99]"
        >
          <PlayCircle className="h-6 w-6 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              继续学习
            </p>
            <p className="font-serif text-sm font-medium truncate mt-0.5">{continueLabel}</p>
          </div>
          <span className="text-muted-foreground group-hover:text-foreground transition">→</span>
        </Link>
      )}

      {/* ── 快捷入口 ────────────────────── */}
      <section className="rounded-xl border bg-card divide-y">
        <Link
          href="/vocabulary"
          className="flex items-center gap-3 p-4 hover:bg-muted/40 active:bg-muted/60 transition"
        >
          <BookMarked className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1 font-medium text-sm">我的生词本</span>
          <span className="text-xs text-muted-foreground tabular-nums font-mono">{vocabCount}</span>
          <span className="text-muted-foreground">→</span>
        </Link>
        <Link
          href="/progress"
          className="flex items-center gap-3 p-4 hover:bg-muted/40 active:bg-muted/60 transition"
        >
          <BarChart3 className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1 font-medium text-sm">学习进度</span>
          <span className="text-muted-foreground">→</span>
        </Link>
        <Link
          href="/upgrade"
          className="flex items-center gap-3 p-4 hover:bg-muted/40 active:bg-muted/60 transition"
        >
          {isPaid ? (
            <Crown className="h-5 w-5 shrink-0 text-amber-500" />
          ) : (
            <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
          )}
          <span className="flex-1 font-medium text-sm">
            {isPaid ? "会员权益与续费" : "升级会员 ¥168 / 年"}
          </span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </section>

      {/* ── 退出登录（次要） ──────────── */}
      <div className="pt-4 flex justify-center">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            退出登录
          </Button>
        </form>
      </div>
    </div>
  );
}
