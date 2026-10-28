import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录的书房样机（room/index.html）：CSS 3D 路线的第一稿，独立页面，不动现有首页 */
export async function GET() {
  return serveYxl(["room", "index.html"], "no-cache");
}
