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

/** GET /api/yxl/files/<id> —— 读自己的电子书（研习录里的 /_blob/<id> 也转到这里）
 *  支持分段读取（Range）：大 PDF 在阅读器里只取看到的那几页，不用先整本下载。 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { user, row } = await mine(req, params.id);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!row) return NextResponse.json({ error: "找不到这个文件" }, { status: 404 });
  const p = path.join(filesDir(), row.userId, row.id);
  let total: number;
  try {
    total = (await stat(p)).size;
  } catch {
    return NextResponse.json({ error: "文件不在了" }, { status: 404 });
  }
  const base: Record<string, string> = {
    "content-type": row.type,
    "accept-ranges": "bytes",
    "content-disposition": "inline; filename*=UTF-8''" + encodeURIComponent(row.name),
    "cache-control": "private, max-age=3600",
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get("range") || "").trim());
  if (range && (range[1] !== "" || range[2] !== "")) {
    const start = range[1] === "" ? Math.max(0, total - Number(range[2])) : Number(range[1]);
    const end = range[1] === "" || range[2] === "" ? total - 1 : Math.min(Number(range[2]), total - 1);
    if (start > end || start >= total) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}`, "accept-ranges": "bytes" } });
    }
    const part = Readable.toWeb(createReadStream(p, { start, end })) as unknown as ReadableStream;
    return new Response(part, { status: 206, headers: { ...base, "content-range": `bytes ${start}-${end}/${total}`, "content-length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(p)) as unknown as ReadableStream;
  return new Response(body, { headers: { ...base, "content-length": String(total) } });
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
