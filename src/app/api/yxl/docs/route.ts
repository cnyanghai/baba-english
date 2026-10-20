import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { yxlUser, okColl, okId, docMax } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** POST /api/yxl/docs  body: { docs: [{ coll, id, data }] } —— 一次写很多条
 *  用在“把 claude.ai 上的记录搬过来”：导出文件里的每条原样写进来，已有的同名记录会被覆盖。 */
export async function POST(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  let body: { docs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const list = Array.isArray(body.docs) ? body.docs : null;
  if (!list || list.length > 5000) return NextResponse.json({ error: "一次最多 5000 条" }, { status: 400 });
  const ok: { coll: string; id: string; data: Prisma.InputJsonValue }[] = [];
  let skipped = 0;
  for (const d of list as { coll?: unknown; id?: unknown; data?: unknown }[]) {
    if (!d || !okColl(d.coll) || !okId(d.id) || !d.data || typeof d.data !== "object" || JSON.stringify(d.data).length > docMax(d.coll)) { skipped++; continue; }
    ok.push({ coll: d.coll, id: d.id, data: d.data as Prisma.InputJsonValue });
  }
  for (let i = 0; i < ok.length; i += 200) {
    await prisma.$transaction(ok.slice(i, i + 200).map((d) => prisma.yxlDoc.upsert({
      where: { userId_coll_docId: { userId: user.id, coll: d.coll, docId: d.id } },
      create: { userId: user.id, coll: d.coll, docId: d.id, data: d.data },
      update: { data: d.data },
    })));
  }
  return NextResponse.json({ ok: true, written: ok.length, skipped });
}
