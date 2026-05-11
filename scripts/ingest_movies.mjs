// 批量 ingest 流水线：bypy 下载 → ffmpeg 720p → subtitlecat SRT → Dialogue 入库
// 设计在 dmit2 上跑（已有 bypy/ffmpeg/PG/baba 仓库）
//
// 单部流程（按顺序）：
//   1) bypy download  -> /opt/baba-ingest/<slug>.raw.mp4
//   2) ffmpeg 720p    -> /opt/baba-videos/<slug>.mp4 (movflags +faststart, 单英音轨)
//   3) subtitlecat    -> data/movies/<slug>/{en.srt,zh-CN.srt}
//   4) srt_to_baba.py -> data/movies/<slug>/<slug>.{transcribe,translations}.json
//   5) 入库 Drama+Episode+Dialogues
//   6) symlink /opt/baba-english/public/videos/<slug>/<slug>.mp4 -> /opt/baba-videos/<slug>.mp4
//   7) rm /opt/baba-ingest/<slug>.raw.mp4
//
// 失败不中断后续电影；每部记录到 ingest.log

import { spawn } from "node:child_process";
import { mkdir, rm, stat, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NETDISK_DIR =
  "/哈利波特全集.2001-2011.蓝光加长版.中粤英音轨.中英字幕-IFA";

const MOVIES = [
  {
    slug: "hp2-chamber-of-secrets",
    netdiskFile:
      "2.Harry.Potter.and.the.Chamber.of.Secrets.Extended.Edition.2002.1080p.BDRip.4Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Chamber of Secrets",
    titleZh: "哈利波特与密室",
    year: 2002,
    searchQuery: "Harry Potter Chamber of Secrets",
    description:
      "二年级开学前夕，家养小精灵多比警告哈利霍格沃茨将有大祸。学院内连续学生被神秘石化，哈利发现自己能听蛇语，揭开尘封的「密室」之谜。",
  },
  {
    slug: "hp3-prisoner-of-azkaban",
    netdiskFile:
      "3.Harry.Potter.and.the.Prisoner.of.Azkaban.2004.1080p.BDRip.4Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Prisoner of Azkaban",
    titleZh: "哈利波特与阿兹卡班的囚徒",
    year: 2004,
    searchQuery: "Harry Potter Prisoner of Azkaban",
    description:
      "三年级，传说从阿兹卡班从未有人逃脱的囚犯小天狼星布莱克越狱了，传言他要追杀哈利。摄魂怪驻守霍格沃茨，黑暗似乎更深一层。",
  },
  {
    slug: "hp4-goblet-of-fire",
    netdiskFile:
      "4.Harry.Potter.and.the.Goblet.of.Fire.2005.1080p.BDRip.4Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Goblet of Fire",
    titleZh: "哈利波特与火焰杯",
    year: 2005,
    searchQuery: "Harry Potter Goblet of Fire",
    description:
      "百年一度的三强争霸赛在霍格沃茨举行。规则之外，火焰杯第四次喷出哈利的名字。十四岁的他被迫直面巨龙、湖底女妖与活体迷宫。",
  },
  {
    slug: "hp5-order-of-the-phoenix",
    netdiskFile:
      "5.Harry.Potter.and.the.Order.of.the.Phoenix.2007.1080p.BDRip.4Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Order of the Phoenix",
    titleZh: "哈利波特与凤凰社",
    year: 2007,
    searchQuery: "Harry Potter Order of the Phoenix",
    description:
      "魔法部坚不承认伏地魔归来，并派乌姆里奇渗透霍格沃茨。哈利秘密组建「邓布利多军团」教授同学防御黑魔法，凤凰社也于幕后集结。",
  },
  {
    slug: "hp6-half-blood-prince",
    netdiskFile:
      "6.Harry.Potter.and.the.Half.Blood.Prince.2009.1080p.BDRip.3Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Half-Blood Prince",
    titleZh: "哈利波特与混血王子",
    year: 2009,
    searchQuery: "Harry Potter Half-Blood Prince",
    description:
      "邓布利多带哈利追溯伏地魔的青年时代，揭示「魂器」之秘。哈利得到一本写满批注的旧魔药书，署名 — 混血王子。",
  },
  {
    slug: "hp7-deathly-hallows-1",
    netdiskFile:
      "7.Harry.Potter.and.the.Deathly.Hallows.Part.1.2010.1080p.BDRip.4Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Deathly Hallows: Part 1",
    titleZh: "哈利波特与死亡圣器（上）",
    year: 2010,
    searchQuery: "Harry Potter Deathly Hallows Part 1",
    description:
      "邓布利多去世后，魔法部沦陷，霍格沃茨已不安全。哈利、罗恩、赫敏离校踏上追寻并销毁魂器的旅途，一路躲避食死徒追杀。",
  },
  {
    slug: "hp8-deathly-hallows-2",
    netdiskFile:
      "8.Harry.Potter.and.the.Deathly.Hallows.Part.2.2011.1080p.BDRip.3Audios.ChsEng-IFA.mp4",
    titleEn: "Harry Potter and the Deathly Hallows: Part 2",
    titleZh: "哈利波特与死亡圣器（下）",
    year: 2011,
    searchQuery: "Harry Potter Deathly Hallows Part 2",
    description:
      "终章。哈利继续追猎残余魂器，潜入古灵阁、重返霍格沃茨。城堡之上，与伏地魔的最终对决一触即发。",
  },
];

const INGEST_DIR = "/opt/baba-ingest";
const VIDEOS_DIR = "/opt/baba-videos";
const REPO_DIR = "/opt/baba-english";

// R2 配置（环境变量；R2 bucket 已建好，AWS profile=r2 已写 ~/.aws/credentials）
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev";
const R2_BUCKET = process.env.R2_BUCKET ?? "baba-videos";
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? "https://0a267c14eb637be210efabbc6b777cd6.r2.cloudflarestorage.com";
const R2_PREFIX = "harry-potter"; // bucket 内目录

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function ingestOne(m) {
  log(`▶ ${m.slug} BEGIN`);
  const rawPath = path.join(INGEST_DIR, `${m.slug}.raw.mp4`);
  const finalVideoPath = path.join(VIDEOS_DIR, `${m.slug}.mp4`);
  const r2Key = `${R2_PREFIX}/${m.slug}.mp4`;
  const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;
  const subtitleDir = path.join(REPO_DIR, "data/movies", m.slug);
  const transcribeJson = path.join(subtitleDir, `${m.slug}.transcribe.json`);
  const translationsJson = path.join(subtitleDir, `${m.slug}.translations.json`);

  // 1. bypy download（720p 已在则跳过下载 + 转码两步）
  let rawSize = 0;
  if (existsSync(finalVideoPath)) {
    log(`  [skip 1+2] 720p 已存在，跳过下载 + 转码`);
  } else if (existsSync(rawPath)) {
    log(`  [skip] raw 已存在: ${rawPath}`);
    rawSize = (await stat(rawPath)).size;
    log(`         raw size = ${(rawSize / 1024 / 1024).toFixed(0)} MB`);
  } else {
    log(`  [1/6] bypy download (aria2 multi-thread) ${m.netdiskFile}`);
    await run("bypy", [
      "--downloader", "aria2",
      "--downloader-arguments", "-x 16 -s 16 -k 4M --file-allocation=none",
      "downfile",
      `${NETDISK_DIR}/${m.netdiskFile}`,
      rawPath,
    ], { cwd: INGEST_DIR });
    rawSize = (await stat(rawPath)).size;
    log(`         raw size = ${(rawSize / 1024 / 1024).toFixed(0)} MB`);
  }

  // 2. ffmpeg 720p
  if (existsSync(finalVideoPath)) {
    // already skipped above
  } else {
    log(`  [2/6] ffmpeg → 720p`);
    await run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-stats", "-y",
      "-i", rawPath,
      "-map", "0:v", "-map", "0:a:0",
      "-c:v", "libx264", "-crf", "22", "-preset", "medium",
      "-profile:v", "high", "-level", "4.0",
      "-vf", "scale=-2:720",
      "-maxrate", "2000k", "-bufsize", "4000k",
      "-c:a", "aac", "-b:a", "96k", "-ac", "2",
      "-movflags", "+faststart",
      finalVideoPath,
    ]);
  }
  const finalSize = (await stat(finalVideoPath)).size;
  log(`         720p size = ${(finalSize / 1024 / 1024).toFixed(0)} MB`);

  // 3. subtitlecat scrape
  if (existsSync(path.join(subtitleDir, "en.srt")) && existsSync(path.join(subtitleDir, "zh-CN.srt"))) {
    log(`  [skip] SRT 已抓: ${subtitleDir}`);
  } else {
    log(`  [3/6] subtitlecat fetch`);
    await run("python3", [
      "scripts/subtitlecat_fetch.py",
      m.slug,
      m.searchQuery,
    ], { cwd: REPO_DIR });
  }

  // 4. srt → baba json
  if (existsSync(transcribeJson) && existsSync(translationsJson)) {
    log(`  [skip] JSON 已合并`);
  } else {
    log(`  [4/6] srt_to_baba`);
    await run("python3", [
      "scripts/srt_to_baba.py",
      path.join(subtitleDir, "en.srt"),
      path.join(subtitleDir, "zh-CN.srt"),
      path.join(subtitleDir, m.slug),
    ], { cwd: REPO_DIR });
  }

  // 5. seed Drama + Episode + Dialogues
  log(`  [5/6] seed DB`);
  const segments = JSON.parse(await readFile(transcribeJson, "utf8"));
  const zh = JSON.parse(await readFile(translationsJson, "utf8"));

  // 幂等：先清同 slug 的旧数据
  await prisma.dialogue.deleteMany({ where: { episode: { drama: { slug: m.slug } } } });
  await prisma.episode.deleteMany({ where: { drama: { slug: m.slug } } });
  await prisma.drama.deleteMany({ where: { slug: m.slug } });

  const drama = await prisma.drama.create({
    data: {
      slug: m.slug,
      type: "MOVIE",
      titleEn: m.titleEn,
      titleZh: m.titleZh,
      description: m.description,
      genres: ["奇幻", "冒险", "家庭"],
      year: m.year,
      posterUrl: null, // 海报后续手动填
    },
  });
  const episode = await prisma.episode.create({
    data: {
      dramaId: drama.id,
      seasonNumber: 1,
      episodeNumber: 1,
      code: "M01",
      title: m.titleEn,
      videoUrl: r2Url, // R2 公开 URL：浏览器直接拉
      durationMs: Math.round(segments[segments.length - 1].end_ms),
    },
  });
  const dialogues = segments.map((s) => ({
    episodeId: episode.id,
    index: s.index,
    startMs: s.start_ms,
    endMs: s.end_ms,
    enText: s.en_text,
    zhText: zh[String(s.index)] ?? null,
  }));
  const r = await prisma.dialogue.createMany({ data: dialogues });
  const withZh = dialogues.filter((d) => d.zhText).length;
  log(`         drama #${drama.id} episode #${episode.id} dialogues=${r.count} (zh=${withZh})`);

  // 6. 上传到 R2
  log(`  [6/6] upload R2 → ${r2Url}`);
  await run("aws", [
    "--profile", "r2",
    "--endpoint-url", R2_ENDPOINT,
    "s3", "cp", finalVideoPath,
    `s3://${R2_BUCKET}/${r2Key}`,
    "--content-type", "video/mp4",
  ]);

  // 7. cleanup：删 raw + 删本地 720p（已上 R2，不再占 dmit 硬盘）
  log(`  cleanup raw + local 720p`);
  if (existsSync(rawPath)) await rm(rawPath);
  await rm(finalVideoPath);

  log(`◀ ${m.slug} DONE  (720p ${(finalSize/1024/1024).toFixed(0)}M → R2)`);
}

async function main() {
  await mkdir(INGEST_DIR, { recursive: true });

  // argv 支持多个 slug。无参数时跑全部，但跳过 DB 中 videoUrl 已是 R2 URL 的（避免重复）
  const filter = process.argv.slice(2);
  let targets = filter.length > 0 ? MOVIES.filter((m) => filter.includes(m.slug)) : MOVIES;
  if (filter.length === 0) {
    // 跳过已迁 R2 的（DB videoUrl 以 https:// 开头）
    const existing = await prisma.drama.findMany({
      where: { slug: { in: MOVIES.map((m) => m.slug) } },
      include: { episodes: { select: { videoUrl: true } } },
    });
    const skipSet = new Set(
      existing
        .filter((d) => d.episodes[0]?.videoUrl?.startsWith("https://"))
        .map((d) => d.slug),
    );
    targets = targets.filter((m) => {
      if (skipSet.has(m.slug)) {
        log(`[skip] ${m.slug} 已在 R2`);
        return false;
      }
      return true;
    });
  }
  if (targets.length === 0) {
    log(`没有要处理的电影`);
    process.exit(0);
  }

  log(`pipeline 开始 — ${targets.length} 部: ${targets.map((m) => m.slug).join(", ")}`);
  for (const m of targets) {
    try {
      await ingestOne(m);
    } catch (e) {
      log(`✗ ${m.slug} FAIL: ${e.message}`);
    }
  }
  log(`pipeline 全部完成`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
