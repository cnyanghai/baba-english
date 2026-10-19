import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { yxlUser, filesDir } from "@/lib/yxl";

export const dynamic = "force-dynamic";

async function mine(req: Request, id: string) {
  const user = await yxlUser(req);
  if (!user) return { user: null, row: null };
  const row = await prisma.yxlFile.findUnique({ where: { id } });
  return { user, row: row && row.userId === user.id ? row : null };
}

/** GET /api/yxl/files/<id> —— 读自己的电子书（研习录里的 /_blob/<id> 也转到这里） */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { user, row } = await mine(req, params.id);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!row) return NextResponse.json({ error: "找不到这个文件" }, { status: 404 });
  const p = path.join(filesDir(), row.userId, row.id);
  try {
    const s = await stat(p);
    const body = Readable.toWeb(createReadStream(p)) as unknown as ReadableStream;
    return new Response(body, {
      headers: {
        "content-type": row.type,
        "content-length": String(s.size),
        "content-disposition": "inline; filename*=UTF-8''" + encodeURIComponent(row.name),
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不在了" }, { status: 404 });
  }
}

/** DELETE /api/yxl/files/<id> —— 删掉自己的一个电子书文件 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { user, row } = await mine(req, params.id);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!row) return NextResponse.json({ deleted: false });
  await prisma.yxlFile.delete({ where: { id: row.id } });
  await unlink(path.join(filesDir(), row.userId, row.id)).catch(() => {});
  return NextResponse.json({ deleted: true });
}
