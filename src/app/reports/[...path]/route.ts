import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录的专题页（reports/*.html，自带数据，新标签页打开） */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  return serveYxl(["reports", ...params.path], "no-cache");
}
