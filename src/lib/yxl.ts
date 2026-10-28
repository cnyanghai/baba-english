// 研习录（网站首页）用到的服务端小工具：认人、校验、文件目录。
//
// 认人有两种：
//   1. 浏览器里登录了 Baba（next-auth 的会话 cookie）——研习录页面上所有读写都走这个；
//   2. 请求头带 `Authorization: Bearer <YXL_AGENT_TOKEN>`——给 Claude 的定时任务用（早上写讲义、晚上记足迹），
//      身份是环境变量 YXL_AGENT_PHONE 对应的那个账号。两个环境变量不设，这条路就是关的。
import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type YxlUser = { id: string; name: string | null; phone: string | null };

export async function yxlUser(req?: Request): Promise<YxlUser | null> {
  const h = req?.headers.get("authorization") ?? "";
  const token = process.env.YXL_AGENT_TOKEN ?? "";
  const phone = process.env.YXL_AGENT_PHONE ?? "";
  if (h.startsWith("Bearer ") && token.length >= 24 && phone) {
    const a = Buffer.from(h.slice(7).trim());
    const b = Buffer.from(token);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      const u = await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true, phone: true } });
      return u ?? null;
    }
    return null;
  }
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, phone: true } });
  return u ?? null;
}

// 研习录前端的记录类别（progress / notes / journal / marks / clips ……）。
// 只收小写字母和数字的名字（2—24 位），以后研习录加新的记录类别不用再改服务器。
export function okColl(c: unknown): c is string {
  return typeof c === "string" && /^[a-z][a-z0-9]{1,23}$/.test(c);
}

// “大件”：每条可能很长（讲义、剪报正文），不随 /api/yxl/state 一起发，前端用 /api/yxl/doc 按需取
export function heavyColl(c: string): boolean {
  return c === "lessons" || /body$/.test(c);
}

export function okId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 160 && !/[\u0000-\u001f]/.test(id);
}

// 单条记录最大 256 KB；大件（剪报正文这类）最大 2 MB
export const YXL_DOC_MAX = 256 * 1024;
export const YXL_HEAVY_MAX = 2 * 1024 * 1024;
export function docMax(c: string): number {
  return heavyColl(c) ? YXL_HEAVY_MAX : YXL_DOC_MAX;
}

// 电子书：单本上限默认 600 MB（环境变量 YXL_FILE_MAX_MB 可改）。大文件走 PUT，边收边写盘，不进内存
export const YXL_FILE_MAX = (Number(process.env.YXL_FILE_MAX_MB) || 600) * 1024 * 1024;
// 旧的表单上传（POST multipart）要把整个文件读进内存，服务器只有 2 G 内存，只给小文件用
export const YXL_FORM_MAX = 48 * 1024 * 1024;
// 写电子书时磁盘至少留 1 GB，免得把 Postgres 挤得写不了盘（交接简报铁律 2）
export const YXL_DISK_RESERVE = 1024 * 1024 * 1024;

export async function freeBytes(dir: string): Promise<number> {
  const { statfs } = await import("node:fs/promises");
  const s = await statfs(dir);
  return Number(s.bavail) * Number(s.bsize);
}
export const YXL_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "text/plain": "b64", // 研习录前端把 EPUB 包成 base64 文本（记录里 enc: "b64"），原样存、原样还
};

export function filesDir(): string {
  return process.env.YXL_FILES_DIR || "/opt/yanxilu-files";
}

// 研习录静态页面所在的目录：一份 cnyanghai/yanxilu 仓库的克隆（服务器上用 cron 定时 git pull）
export function siteDir(): string {
  return process.env.YXL_DIR || "/opt/yanxilu";
}

// 把 URL 里的相对路径安全地拼到某个目录下：不许跳出目录、不许隐藏文件
export function safeJoin(base: string, parts: string[]): string | null {
  if (!parts.length || parts.some((p) => !p || p.startsWith(".") || p.includes("\\") || p.includes("\u0000"))) return null;
  const full = path.resolve(base, ...parts);
  const root = path.resolve(base) + path.sep;
  return full.startsWith(root) ? full : null;
}

export const STATIC_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2", // 研习录自带的字体分片（vendor/fonts）
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".wasm": "application/wasm", // 研习录自带的 three.js 解码器（Draco、KTX2）
  ".webp": "image/webp",
};

// 从研习录目录里读一个静态文件（首页 server/index.html、PDF.js、专题页）
// 研习录的仓库是服务器上单独的一份克隆，cron 定时 git pull，所以每次请求现读，不用重新 build Baba。
export async function serveYxl(parts: string[], cache: string): Promise<Response> {
  const { readFile, stat } = await import("node:fs/promises");
  const p = safeJoin(siteDir(), parts);
  const type = p ? STATIC_TYPES[path.extname(p).toLowerCase()] : undefined;
  if (!p || !type) return new Response("Not found", { status: 404 });
  try {
    const s = await stat(p);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const etag = '"' + s.size.toString(36) + "-" + Math.floor(s.mtimeMs).toString(36) + '"';
    const body = await readFile(p);
    return new Response(body, { headers: { "content-type": type, "cache-control": cache, etag, "x-content-type-options": "nosniff" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
