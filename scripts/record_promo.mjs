// Playwright 录制 /promo 页 60 秒 → webm
// 用法：node scripts/record_promo.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = "https://baba.wogucloud.cn/promo";
const OUT_DIR = "/opt/baba-record/output";
const W = 1920;
const H = 1080;
const DURATION_MS = 62_000; // 60s + 2s buffer

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
  });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT_DIR, size: { width: W, height: H } },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  console.log(`[record] opening ${URL}`);
  await page.goto(URL, { waitUntil: "networkidle" });
  // 等 hero 视频开始 + 时间轴稳定
  await page.waitForTimeout(800);
  console.log(`[record] recording ${DURATION_MS}ms ...`);
  await page.waitForTimeout(DURATION_MS);
  await ctx.close(); // 触发 video 写盘
  await browser.close();

  // playwright 输出 webm，文件名自动生成
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
  const webmFile = files.sort((a, b) =>
    fs.statSync(path.join(OUT_DIR, b)).mtimeMs - fs.statSync(path.join(OUT_DIR, a)).mtimeMs,
  )[0];
  console.log(`[record] done: ${OUT_DIR}/${webmFile}`);
})();
