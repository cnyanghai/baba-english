import { serveYxl, siteDir, safeJoin } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录的页面目录（通配）：研习录克隆里任何带 index.html 的顶层目录都直接对外，
 *  例如 /room → room/index.html，/world → world/index.html，/world/world.js → world/world.js。
 *  以后研习录加新目录（花房、宠物间）推到它的 main 就上线，不用再改 Baba、再部署。
 *  Baba 自己的页面（/english、/books、/api 等）是静态段，Next 优先匹配它们，不会落到这里。
 *  不对外的目录写在 DENY 里；没有 index.html 的目录（src、tools）也不对外。vendor、reports 另有路由。 */
const DENY = new Set(["server", "src", "tools", "study", "dist", "design", "data", "api", "_next", "node_modules"]);

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const parts = params.path || [];
  const top = parts[0];
  if (!top || DENY.has(top)) return new Response("Not found", { status: 404 });
  const idx = safeJoin(siteDir(), [top, "index.html"]);
  if (!idx) return new Response("Not found", { status: 404 });
  try {
    const { stat } = await import("node:fs/promises");
    if (!(await stat(idx)).isFile()) return new Response("Not found", { status: 404 });
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (parts.length === 1) return serveYxl([top, "index.html"], "no-cache");
  const last = parts[parts.length - 1];
  // 页面和脚本不缓存（研习录随时在改）；别的静态文件缓一天
  const cache = /\.(html?|m?js|json)$/i.test(last) ? "no-cache" : "public, max-age=86400";
  return serveYxl(parts, cache);
}
