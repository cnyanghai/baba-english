import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录版本 2 的小世界（world/index.html）：WebGL 的书房，独立页面；three.js 从 /vendor/three 读 */
export async function GET() {
  return serveYxl(["world", "index.html"], "no-cache");
}
