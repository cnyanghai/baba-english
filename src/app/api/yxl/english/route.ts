import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { yxlUser } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** GET /api/yxl/english —— 研习录书架上「英语」那一格要的数据：
 *  有哪些片（每部几集、多少句）、你看到哪了（每集最后一句、累计时长）、生词本里各状态多少个。
 *  没登录也能看片单，只是没有进度和生词。 */
export async function GET(req: Request) {
  const user = await yxlUser(req);
  const dramas = await prisma.drama.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, slug: true, type: true, titleEn: true, titleZh: true, posterUrl: true, year: true,
      episodes: {
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        select: { id: true, code: true, title: true, seasonNumber: true, episodeNumber: true, durationMs: true, _count: { select: { dialogues: true } } },
      },
    },
  });

  let paid = false;
  let progress: Array<{ episodeId: number; lastIdx: number; totalWatchedMs: number; updatedAt: Date }> = [];
  let vocab = { total: 0, new: 0, learning: 0, known: 0, lastAddedAt: null as string | null };
  if (user) {
    const [u, pr, groups, last] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { paidUntil: true } }),
      prisma.episodeProgress.findMany({ where: { userId: user.id }, select: { episodeId: true, lastIdx: true, totalWatchedMs: true, updatedAt: true } }),
      prisma.userVocabulary.groupBy({ by: ["status"], where: { userId: user.id }, _count: { _all: true } }),
      prisma.userVocabulary.findFirst({ where: { userId: user.id }, orderBy: { addedAt: "desc" }, select: { addedAt: true } }),
    ]);
    paid = !!(u?.paidUntil && u.paidUntil > new Date());
    progress = pr;
    for (const g of groups) {
      const n = g._count._all;
      vocab.total += n;
      if (g.status === "learning") vocab.learning += n;
      else if (g.status === "known") vocab.known += n;
      else vocab.new += n;
    }
    vocab.lastAddedAt = last?.addedAt.toISOString() ?? null;
  }
  const byEp = new Map(progress.map((p) => [p.episodeId, p]));

  const out = dramas.map((d) => {
    let sentences = 0, reached = 0, watchedMs = 0;
    let last: { code: string; idx: number; at: string } | null = null;
    const episodes = d.episodes.map((e) => {
      const n = e._count.dialogues;
      const p = byEp.get(e.id);
      sentences += n;
      if (p) {
        // 「看到哪了」= 最后一句的序号 + 1（看到最后一句就算这一集看完）
        reached += Math.min(n, p.lastIdx + 1);
        watchedMs += p.totalWatchedMs;
        const at = p.updatedAt.toISOString();
        if (!last || at > last.at) last = { code: e.code, idx: p.lastIdx, at };
      }
      return {
        code: e.code, title: e.title, season: e.seasonNumber, episode: e.episodeNumber, durationMs: e.durationMs,
        sentences: n, lastIdx: p ? p.lastIdx : null, watchedMs: p ? p.totalWatchedMs : 0, at: p ? p.updatedAt.toISOString() : null,
      };
    });
    return {
      slug: d.slug, type: d.type, titleEn: d.titleEn, titleZh: d.titleZh, posterUrl: d.posterUrl, year: d.year,
      sentences, reached, watchedMs, last, episodes,
    };
  });

  return NextResponse.json(
    { user: user ? { name: user.name } : null, paid, dramas: out, vocab, at: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
