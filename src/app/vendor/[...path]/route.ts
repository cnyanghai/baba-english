import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录随站点带的第三方库（PDF.js 和它的字体、字符映射表） */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  return serveYxl(["vendor", ...params.path], "public, max-age=86400");
}
