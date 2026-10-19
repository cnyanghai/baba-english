import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { yxlUser, filesDir, YXL_FILE_MAX, YXL_FILE_TYPES } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** POST /api/yxl/files  (multipart/form-data, 字段 file) —— 上传一本电子书
 *  返回 { id, url, sizeBytes, contentType }，和 claude.ai 上研习录用的 assets.upload 一样的形状。 */
export async function POST(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录", code: "not_granted" }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
  const name = (file as File).name || "book";
  let type = file.type;
  if (!YXL_FILE_TYPES[type]) {
    if (/\.pdf$/i.test(name)) type = "application/pdf";
    else if (/\.epub$/i.test(name)) type = "application/epub+zip";
  }
  if (!YXL_FILE_TYPES[type]) return NextResponse.json({ error: "只能上传 PDF 或 EPUB", code: "unsupported_type" }, { status: 415 });
  if (file.size > YXL_FILE_MAX) return NextResponse.json({ error: "文件太大了", code: "too_large" }, { status: 413 });

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
  return NextResponse.json({ id: row.id, url: "/api/yxl/files/" + row.id, sizeBytes: row.size, contentType: type });
}

/** GET /api/yxl/files —— 列出自己的电子书文件 */
export async function GET(req: Request) {
  const user = await yxlUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const assets = await prisma.yxlFile.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const total = assets.reduce((n, a) => n + a.size, 0);
  return NextResponse.json({ assets: assets.map((a) => ({ id: a.id, name: a.name, contentType: a.type, sizeBytes: a.size, url: "/api/yxl/files/" + a.id })), usage: { bytes: total } });
}
