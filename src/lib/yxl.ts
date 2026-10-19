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

// 研习录前端用到的记录类别。只收这些，防止乱写。
export const YXL_COLLS = [
  "progress", "notes", "journal", "cards", "study", "film", "ebooks",
  "mybooks", "hidden", "reading", "marks", "domains", "lessons",
] as const;

export function okColl(c: unknown): c is string {
  return typeof c === "string" && (YXL_COLLS as readonly string[]).includes(c);
}

export function okId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 160 && !/[\u0000-\u001f]/.test(id);
}

// 单条记录最大 256 KB（讲义 md 最长的也就几十 KB）
export const YXL_DOC_MAX = 256 * 1024;

// 电子书：单个文件最大 48 MB（EPUB 前端会包成 base64 文本再传，体积大三分之一）
export const YXL_FILE_MAX = 48 * 1024 * 1024;
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
  ".png": "image/png",
  ".jpg": "image/jpeg",
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
