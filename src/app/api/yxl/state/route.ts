import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { yxlUser, YXL_FILE_MAX } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** GET /api/yxl/state —— 研习录打开时取当前用户的全部记录
 *  返回 { user: {id,name}|null, docs: { coll: { docId: data } }, at }
 *  不登录也能打开研习录（只读看公开内容），这时 user 是 null、docs 是空的。
 *  讲义（lessons）和剪报正文（clipbody 这类 …body）每条可能很长，不在这里一起发，前端用 /api/yxl/doc 按需取。 */
// 告诉研习录这台服务器能做什么：电子书走 PUT 流式上传，单本上限多少 MB
// clips：能存剪报（任意记录类别 + 正文这类大件按需读）
const CAPS = { put: true, maxMB: Math.floor(YXL_FILE_MAX / 1048576), clips: true };

export async function GET(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ user: null, docs: {}, caps: CAPS, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  const rows = await prisma.yxlDoc.findMany({
    where: { userId: user.id, NOT: { OR: [{ coll: "lessons" }, { coll: { endsWith: "body" } }] } },
    select: { coll: true, docId: true, data: true },
  });
  const docs: Record<string, Record<string, unknown>> = {};
  for (const r of rows) (docs[r.coll] ||= {})[r.docId] = r.data;
  return NextResponse.json(
    { user: { id: user.id, name: user.name || (user.phone ? user.phone.slice(0, 3) + "****" + user.phone.slice(-4) : "我") }, docs, caps: CAPS, at: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
