import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 小世界页面自己的脚本和配置（world/world.js、world/sample.js、以后的房间配置） */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  return serveYxl(["world", ...params.path], "no-cache");
}
