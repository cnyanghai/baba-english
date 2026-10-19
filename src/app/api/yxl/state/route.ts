import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { yxlUser } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** GET /api/yxl/state —— 研习录打开时取当前用户的全部记录
 *  返回 { user: {id,name}|null, docs: { coll: { docId: data } }, at }
 *  不登录也能打开研习录（只读看公开内容），这时 user 是 null、docs 是空的。
 *  讲义（lessons）每条可能很长，不在这里一起发，前端用 /api/yxl/doc 按需取。 */
export async function GET(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ user: null, docs: {}, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  const rows = await prisma.yxlDoc.findMany({
    where: { userId: user.id, NOT: { coll: "lessons" } },
    select: { coll: true, docId: true, data: true },
  });
  const docs: Record<string, Record<string, unknown>> = {};
  for (const r of rows) (docs[r.coll] ||= {})[r.docId] = r.data;
  return NextResponse.json(
    { user: { id: user.id, name: user.name || (user.phone ? user.phone.slice(0, 3) + "****" + user.phone.slice(-4) : "我") }, docs, at: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
