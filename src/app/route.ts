import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 网站首页 = 研习录（YXL_DIR/server/index.html）。Baba 原来的首页挪到了 /english，英语的东西在研习录书架的「英语」一层里。 */
export async function GET() {
  const r = await serveYxl(["server", "index.html"], "no-cache");
  if (r.status === 404) {
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>研习录</title><p style="font:16px/1.7 sans-serif;margin:3em auto;max-width:32em">研习录的页面还没放上来（服务器上缺 ' +
        (process.env.YXL_DIR || "/opt/yanxilu") + '/server/index.html）。<br><a href="/english">先去 Baba 英语 →</a></p>',
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return r;
}
