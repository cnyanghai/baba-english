// 竖屏录屏：1080×1920
// 修：goto 用 "load" 不要 "networkidle"（hero 视频流式拉取不会触发 idle）
// 修：try/catch 确保 ctx.close() 一定被调用（保证 webm 完整写盘）
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = "https://baba.wogucloud.cn/promo?headless=1";
const OUT_DIR = "/opt/baba-record/output-vertical";
const W = 1080;
const H = 1920;
const DURATION_MS = 32_000;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) fs.unlinkSync(path.join(OUT_DIR, f));

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
  });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT_DIR, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();
  console.log(`[record] vertical ${W}x${H} ${URL}`);

  try {
    await page.goto(URL, { waitUntil: "load", timeout: 60_000 });
    // 等场景容器渲染好（避免一开始白屏）
    await page.waitForSelector("text=学了", { timeout: 30_000 }).catch(() => {});
    console.log(`[record] page ready, recording ${DURATION_MS}ms`);
    await page.waitForTimeout(DURATION_MS);
  } catch (e) {
    console.error(`[record] goto/wait error:`, e.message);
  } finally {
    await ctx.close(); // 一定 close → webm 完整
    await browser.close();
  }

  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
  console.log(`[record] done: ${OUT_DIR}/${files[0]}`);
})();
