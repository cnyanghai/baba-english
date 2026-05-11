// W1 种子：Friends S01E01 入库
// 前 35 句手译中文，其余仅 EN（待后续翻译流水线）

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// 翻译从 data/friends_s01e01.translations.json 加载（全部 471 句）
const translationsPath = path.join(__dirname, "..", "data", "friends_s01e01.translations.json");
const ZH = JSON.parse(fs.readFileSync(translationsPath, "utf8"));

async function main() {
  const transcribePath = path.join(__dirname, "..", "data", "friends_s01e01.transcribe.json");
  const segments = JSON.parse(fs.readFileSync(transcribePath, "utf8"));
  console.log(`[seed] loaded ${segments.length} segments`);

  // 1. 清旧数据（幂等）
  await prisma.dialogue.deleteMany({ where: { episode: { drama: { slug: "friends" } } } });
  await prisma.episode.deleteMany({ where: { drama: { slug: "friends" } } });
  await prisma.drama.deleteMany({ where: { slug: "friends" } });

  // 2. Drama
  const drama = await prisma.drama.create({
    data: {
      slug: "friends",
      type: "DRAMA",
      titleEn: "Friends",
      titleZh: "老友记",
      description: "围绕住在纽约曼哈顿的六个朋友的生活展开的美国情景喜剧。",
      genres: ["喜剧", "爱情"],
      year: 1994,
      posterUrl: "/posters/friends.jpg",
    },
  });
  console.log(`[seed] drama #${drama.id} ${drama.slug}`);

  // 3. Episode
  const episode = await prisma.episode.create({
    data: {
      dramaId: drama.id,
      seasonNumber: 1,
      episodeNumber: 1,
      code: "S01E01",
      title: "The Pilot — The One Where Monica Gets a Roommate",
      videoUrl: "/videos/friends/S01E01.mp4",
      durationMs: Math.round(segments[segments.length - 1].end_ms),
    },
  });
  console.log(`[seed] episode #${episode.id} ${episode.code}`);

  // 4. Dialogues 批量插入
  const data = segments.map((s) => ({
    episodeId: episode.id,
    index: s.index,
    startMs: s.start_ms,
    endMs: s.end_ms,
    enText: s.en_text,
    zhText: ZH[s.index] ?? null,
  }));
  const result = await prisma.dialogue.createMany({ data });
  console.log(`[seed] inserted ${result.count} dialogues (${Object.keys(ZH).length} with ZH)`);

  // 5. 抽样验证
  const first = await prisma.dialogue.findFirst({
    where: { episodeId: episode.id, index: 0 },
  });
  console.log("[seed] sample dialogue#0:", first);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
