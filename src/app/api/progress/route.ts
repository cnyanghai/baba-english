import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/progress?episodeId=X — 当前用户对该集的进度 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const url = new URL(req.url);
  const episodeId = Number.parseInt(url.searchParams.get("episodeId") ?? "", 10);
  if (!Number.isFinite(episodeId) || episodeId <= 0) {
    return NextResponse.json({ error: "缺少 episodeId" }, { status: 400 });
  }

  const progress = await prisma.episodeProgress.findUnique({
    where: { userId_episodeId: { userId, episodeId } },
  });

  return NextResponse.json({ progress });
}

/** PUT /api/progress
 * body: { episodeId, lastIdx, lastTimeMs, watchedMsDelta? }
 * upsert: 存在则更新（lastIdx/lastTimeMs 覆盖，totalWatchedMs 累加 delta）
 */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: {
    episodeId?: number;
    lastIdx?: number;
    lastTimeMs?: number;
    watchedMsDelta?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const episodeId = Number(body.episodeId);
  const lastIdx = Math.max(0, Math.floor(Number(body.lastIdx ?? 0)));
  const lastTimeMs = Math.max(0, Math.floor(Number(body.lastTimeMs ?? 0)));
  const delta = Math.max(0, Math.floor(Number(body.watchedMsDelta ?? 0)));

  if (!Number.isFinite(episodeId) || episodeId <= 0) {
    return NextResponse.json({ error: "无效 episodeId" }, { status: 400 });
  }

  // 防御：单次 delta 不超过 60 秒（防止时钟错乱或恶意）
  const safeDelta = Math.min(delta, 60_000);

  const result = await prisma.episodeProgress.upsert({
    where: { userId_episodeId: { userId, episodeId } },
    create: {
      userId,
      episodeId,
      lastIdx,
      lastTimeMs,
      totalWatchedMs: safeDelta,
    },
    update: {
      lastIdx,
      lastTimeMs,
      totalWatchedMs: { increment: safeDelta },
    },
  });

  return NextResponse.json({ ok: true, progress: result });
}
