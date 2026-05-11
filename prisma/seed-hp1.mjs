// Seed: Harry Potter and the Sorcerer's Stone (Extended Cut, 2001)
// 数据来源：subtitlecat.com 的中英 SRT，时间轴完全对齐

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const SLUG = "hp1-sorcerers-stone";
const DATA_DIR = path.join(__dirname, "..", "data", "harry-potter");

const ZH = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "hp1.translations.json"), "utf8"));
const SEGMENTS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "hp1.transcribe.json"), "utf8"));

async function main() {
  console.log(`[seed] loaded ${SEGMENTS.length} segments`);

  // 清旧（幂等）
  await prisma.dialogue.deleteMany({ where: { episode: { drama: { slug: SLUG } } } });
  await prisma.episode.deleteMany({ where: { drama: { slug: SLUG } } });
  await prisma.drama.deleteMany({ where: { slug: SLUG } });

  // Drama
  const drama = await prisma.drama.create({
    data: {
      slug: SLUG,
      type: "MOVIE",
      titleEn: "Harry Potter and the Sorcerer's Stone",
      titleZh: "哈利波特与魔法石",
      description:
        "11 岁的哈利在生日当天得知自己是巫师，前往霍格沃茨魔法学校学习，结识好友罗恩、赫敏，揭开父母之死的真相，并阻止伏地魔重返世间。加长版含数十分钟未公映片段。",
      genres: ["奇幻", "冒险", "家庭"],
      year: 2001,
      posterUrl: "/posters/hp1.jpg",
    },
  });
  console.log(`[seed] drama #${drama.id} ${drama.slug}`);

  // Episode（电影类型用单"集"承载完整片）
  const episode = await prisma.episode.create({
    data: {
      dramaId: drama.id,
      seasonNumber: 1,
      episodeNumber: 1,
      code: "M01",
      title: "Sorcerer's Stone (Extended Cut)",
      videoUrl: "/videos/harry-potter/HP1-Sorcerers-Stone.mp4",
      durationMs: Math.round(SEGMENTS[SEGMENTS.length - 1].end_ms),
    },
  });
  console.log(`[seed] episode #${episode.id} ${episode.code}`);

  // Dialogues 批量插入
  const data = SEGMENTS.map((s) => ({
    episodeId: episode.id,
    index: s.index,
    startMs: s.start_ms,
    endMs: s.end_ms,
    enText: s.en_text,
    zhText: ZH[String(s.index)] ?? null,
  }));
  const result = await prisma.dialogue.createMany({ data });
  const withZh = data.filter((d) => d.zhText).length;
  console.log(`[seed] inserted ${result.count} dialogues (${withZh} with ZH)`);

  // 抽样
  const sample = await prisma.dialogue.findFirst({
    where: { episodeId: episode.id, index: 0 },
  });
  console.log("[seed] sample dialogue#0:", sample);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
