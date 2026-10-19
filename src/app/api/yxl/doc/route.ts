import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { yxlUser, okColl, okId, YXL_DOC_MAX } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** GET /api/yxl/doc?coll=lessons&id=2026-10-19 —— 取一条记录（讲义按需读） */
export async function GET(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const u = new URL(req.url);
  const coll = u.searchParams.get("coll"), id = u.searchParams.get("id");
  if (!okColl(coll) || !okId(id)) return NextResponse.json({ error: "参数不对" }, { status: 400 });
  const row = await prisma.yxlDoc.findUnique({ where: { userId_coll_docId: { userId: user.id, coll, docId: id } }, select: { data: true } });
  return NextResponse.json({ exists: !!row, data: row?.data ?? null }, { headers: { "cache-control": "no-store" } });
}

/** PUT /api/yxl/doc  body: { coll, id, data } —— 写一条（整条覆盖） */
export async function PUT(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  let body: { coll?: unknown; id?: unknown; data?: unknown };
  try {
    const text = await req.text();
    if (text.length > YXL_DOC_MAX) return NextResponse.json({ error: "这条记录太大了" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const { coll, id, data } = body;
  if (!okColl(coll) || !okId(id) || data === undefined || data === null || typeof data !== "object") {
    return NextResponse.json({ error: "参数不对" }, { status: 400 });
  }
  const json = data as Prisma.InputJsonValue;
  await prisma.yxlDoc.upsert({
    where: { userId_coll_docId: { userId: user.id, coll, docId: id } },
    create: { userId: user.id, coll, docId: id, data: json },
    update: { data: json },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/yxl/doc?coll=notes&id=xxx —— 删一条 */
export async function DELETE(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const u = new URL(req.url);
  const coll = u.searchParams.get("coll"), id = u.searchParams.get("id");
  if (!okColl(coll) || !okId(id)) return NextResponse.json({ error: "参数不对" }, { status: 400 });
  await prisma.yxlDoc.deleteMany({ where: { userId: user.id, coll, docId: id } });
  return NextResponse.json({ ok: true });
}
