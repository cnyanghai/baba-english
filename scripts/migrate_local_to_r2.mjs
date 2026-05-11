// 把已入库 drama 的本地 720p 视频迁移到 R2：
// 1. aws s3 cp 上传
// 2. DB videoUrl 改成 R2 公开 URL
// 3. 删除本地 video 文件
//
// 用法：node scripts/migrate_local_to_r2.mjs            (迁移所有指向本地路径的 drama)
//      node scripts/migrate_local_to_r2.mjs hp1-... hp2-...  (限定 slug)

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev";
const R2_BUCKET = process.env.R2_BUCKET ?? "baba-videos";
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? "https://0a267c14eb637be210efabbc6b777cd6.r2.cloudflarestorage.com";
const R2_PREFIX = "harry-potter";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

// drama.slug ↔ 本地 720p 文件名 / R2 key 的映射
// 注意：HP1 历史上文件名是大写带短横 "HP1-Sorcerers-Stone.mp4"，HP2/HP3 用 slug 命名
const FILENAME_MAP = {
  "hp1-sorcerers-stone": "HP1-Sorcerers-Stone-en.mp4",
};

function localFileFor(slug) {
  return path.join("/opt/baba-videos", FILENAME_MAP[slug] ?? `${slug}.mp4`);
}

async function migrate(drama) {
  const slug = drama.slug;
  const episode = drama.episodes[0];
  const local = localFileFor(slug);
  const r2Key = `${R2_PREFIX}/${slug}.mp4`;
  const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

  if (!existsSync(local)) {
    console.log(`[skip] ${slug}: local file missing: ${local}`);
    return;
  }
  if (episode.videoUrl.startsWith("https://")) {
    console.log(`[skip] ${slug}: already R2 → ${episode.videoUrl}`);
    return;
  }

  console.log(`▶ ${slug}: ${local} → R2`);
  await run("aws", [
    "--profile", "r2",
    "--endpoint-url", R2_ENDPOINT,
    "s3", "cp", local,
    `s3://${R2_BUCKET}/${r2Key}`,
    "--content-type", "video/mp4",
  ]);

  await prisma.episode.update({
    where: { id: episode.id },
    data: { videoUrl: r2Url },
  });
  console.log(`  DB updated → ${r2Url}`);

  await rm(local);
  console.log(`  local deleted`);
  console.log(`◀ ${slug} DONE`);
}

async function main() {
  const args = process.argv.slice(2);
  const dramas = await prisma.drama.findMany({
    where: args.length > 0 ? { slug: { in: args } } : { type: "MOVIE" },
    include: { episodes: { select: { id: true, videoUrl: true } } },
  });
  console.log(`找到 ${dramas.length} 部要处理`);
  for (const d of dramas) {
    try {
      await migrate(d);
    } catch (e) {
      console.error(`✗ ${d.slug} FAIL:`, e.message);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
