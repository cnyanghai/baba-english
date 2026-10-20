import { NextResponse } from "next/server";
import { createWriteStream } from "node:fs";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { prisma } from "@/lib/prisma";
import { yxlUser, filesDir, freeBytes, YXL_FILE_MAX, YXL_FORM_MAX, YXL_FILE_TYPES, YXL_DISK_RESERVE } from "@/lib/yxl";

export const dynamic = "force-dynamic";

function pickType(type: string, name: string): string {
  let t = (type || "").split(";")[0].trim().toLowerCase();
  if (!YXL_FILE_TYPES[t]) {
    if (/\.pdf$/i.test(name)) t = "application/pdf";
    else if (/\.epub$/i.test(name)) t = "application/epub+zip";
  }
  return YXL_FILE_TYPES[t] ? t : "";
}

function out(row: { id: string; size: number }, type: string) {
  return NextResponse.json({ id: row.id, url: "/api/yxl/files/" + row.id, sizeBytes: row.size, contentType: type });
}

/** PUT /api/yxl/files?name=<文件名>  请求体就是文件本身，Content-Type 写文件类型。
 *  研习录上传电子书走这个：边收边写盘，几百 MB 的书也不占内存；超过上限或磁盘不够就停下，半截文件删掉。 */
export async function PUT(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录", code: "upstream_auth" }, { status: 401 });
  const name = (new URL(req.url).searchParams.get("name") || "book").slice(0, 200);
  const type = pickType(req.headers.get("content-type") || "", name);
  if (!type) return NextResponse.json({ error: "只能上传 PDF 或 EPUB", code: "unsupported_type" }, { status: 415 });
  const len = Number(req.headers.get("content-length") || 0);
  if (len > YXL_FILE_MAX) return NextResponse.json({ error: "文件太大了", code: "too_large" }, { status: 413 });
  if (!req.body) return NextResponse.json({ error: "没有收到文件" }, { status: 400 });

  const dir = path.join(filesDir(), user.id);
  await mkdir(dir, { recursive: true });
  const free = await freeBytes(dir).catch(() => Number.POSITIVE_INFINITY);
  if (free - len < YXL_DISK_RESERVE) return NextResponse.json({ error: "服务器的磁盘快满了", code: "disk_full" }, { status: 507 });

  const row = await prisma.yxlFile.create({ data: { userId: user.id, name, type, size: 0 } });
  const tmp = path.join(dir, row.id + ".part");
  let size = 0;
  const count = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      size += chunk.length;
      if (size > YXL_FILE_MAX) cb(new Error("too_large"));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(req.body as unknown as import("node:stream/web").ReadableStream), count, createWriteStream(tmp));
    if (!size) throw new Error("empty");
    await rename(tmp, path.join(dir, row.id));
    await prisma.yxlFile.update({ where: { id: row.id }, data: { size } });
  } catch (e) {
    await unlink(tmp).catch(() => {});
    await prisma.yxlFile.delete({ where: { id: row.id } }).catch(() => {});
    const msg = (e as Error).message;
    if (msg === "too_large") return NextResponse.json({ error: "文件太大了", code: "too_large" }, { status: 413 });
    if (msg === "empty") return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    console.error("[yxl] 收文件失败", e);
    return NextResponse.json({ error: "上传中断了", code: "store_unavailable" }, { status: 500 });
  }
  return out({ id: row.id, size }, type);
}

/** POST /api/yxl/files  (multipart/form-data, 字段 file) —— 旧的表单上传，整个文件会进内存，只收 48 MB 以内的 */
export async function POST(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录", code: "upstream_auth" }, { status: 401 });
  const len = Number(req.headers.get("content-length") || 0);
  if (len > YXL_FORM_MAX) return NextResponse.json({ error: "文件太大了", code: "too_large" }, { status: 413 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
  const name = (file as File).name || "book";
  const type = pickType(file.type, name);
  if (!type) return NextResponse.json({ error: "只能上传 PDF 或 EPUB", code: "unsupported_type" }, { status: 415 });
  if (file.size > YXL_FORM_MAX) return NextResponse.json({ error: "文件太大了", code: "too_large" }, { status: 413 });

  const row = await prisma.yxlFile.create({ data: { userId: user.id, name: name.slice(0, 200), type, size: file.size } });
  const dir = path.join(filesDir(), user.id);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, row.id), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    await prisma.yxlFile.delete({ where: { id: row.id } }).catch(() => {});
    console.error("[yxl] 写文件失败", e);
    return NextResponse.json({ error: "服务器存不下这个文件", code: "store_unavailable" }, { status: 500 });
  }
  return out(row, type);
}

/** GET /api/yxl/files —— 列出自己的电子书文件 */
export async function GET(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const assets = await prisma.yxlFile.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const total = assets.reduce((n, a) => n + a.size, 0);
  return NextResponse.json({ assets: assets.map((a) => ({ id: a.id, name: a.name, contentType: a.type, sizeBytes: a.size, url: "/api/yxl/files/" + a.id })), usage: { bytes: total } });
}
