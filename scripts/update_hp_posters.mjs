// 给 HP2-8 写入 posterUrl（idempotent；drama 不存在则跳过）
// 海报已下载到 /opt/baba-english/public/posters/<slug>.jpg

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const R2 = "https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev";
const POSTERS = {
  "hp2-chamber-of-secrets":   `${R2}/posters/hp2.jpg`,
  "hp3-prisoner-of-azkaban":  `${R2}/posters/hp3.jpg`,
  "hp4-goblet-of-fire":       `${R2}/posters/hp4.jpg`,
  "hp5-order-of-the-phoenix": `${R2}/posters/hp5.jpg`,
  "hp6-half-blood-prince":    `${R2}/posters/hp6.jpg`,
  "hp7-deathly-hallows-1":    `${R2}/posters/hp7.jpg`,
  "hp8-deathly-hallows-2":    `${R2}/posters/hp8.jpg`,
};

async function main() {
  for (const [slug, posterUrl] of Object.entries(POSTERS)) {
    const r = await prisma.drama.updateMany({
      where: { slug },
      data: { posterUrl },
    });
    console.log(`${slug} → ${posterUrl}  (${r.count} updated)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
