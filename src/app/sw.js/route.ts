import { serveYxl } from "@/lib/yxl";

export const dynamic = "force-dynamic";

/** 研习录的 Service Worker（手机装成 App、离线缓存）。
 *  必须挂在根路径，作用域才能盖住整站；no-cache 让新版本尽快生效。 */
export async function GET() {
  return serveYxl(["sw.js"], "no-cache");
}
