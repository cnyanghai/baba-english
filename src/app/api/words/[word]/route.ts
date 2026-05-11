import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** 简单词形候选生成：原词 / 全小写 / 首字母大写 / 去掉常见后缀 */
function lookupCandidates(input: string): string[] {
  const word = input.trim();
  if (!word) return [];
  const lower = word.toLowerCase();
  const candidates = new Set<string>([word, lower]);

  // 首字母大写（专有名词如 Paul）
  candidates.add(lower.charAt(0).toUpperCase() + lower.slice(1));

  const tryRoot = (root: string) => {
    if (root.length >= 2) candidates.add(root);
  };
  // 复数 / 三单
  if (lower.endsWith("s") && lower.length > 2) tryRoot(lower.slice(0, -1));
  if (lower.endsWith("es") && lower.length > 3) tryRoot(lower.slice(0, -2));
  if (lower.endsWith("ies") && lower.length > 3) tryRoot(lower.slice(0, -3) + "y");
  // 过去式 / 过去分词
  if (lower.endsWith("ed") && lower.length > 3) {
    tryRoot(lower.slice(0, -2));
    tryRoot(lower.slice(0, -1)); // baked → bake
    if (lower.length > 4 && lower[lower.length - 3] === lower[lower.length - 4]) {
      tryRoot(lower.slice(0, -3)); // stopped → stop
    }
  }
  // 现在分词
  if (lower.endsWith("ing") && lower.length > 4) {
    tryRoot(lower.slice(0, -3));
    tryRoot(lower.slice(0, -3) + "e"); // baking → bake
    if (lower.length > 5 && lower[lower.length - 4] === lower[lower.length - 5]) {
      tryRoot(lower.slice(0, -4)); // running → run
    }
  }
  // 比较级 / 最高级
  if (lower.endsWith("er") && lower.length > 3) tryRoot(lower.slice(0, -2));
  if (lower.endsWith("est") && lower.length > 4) tryRoot(lower.slice(0, -3));

  return [...candidates];
}

export async function GET(
  _req: Request,
  { params }: { params: { word: string } },
) {
  const raw = decodeURIComponent(params.word).replace(/[^a-zA-Z'-]/g, "");
  if (!raw) {
    return NextResponse.json({ error: "无效单词" }, { status: 400 });
  }

  const candidates = lookupCandidates(raw);
  const [matches, etyms] = await Promise.all([
    prisma.word.findMany({
      where: { lemma: { in: candidates } },
      select: { lemma: true, ipa: true, definitions: true, freq: true },
    }),
    prisma.wordEtymology.findMany({
      where: { lemma: { in: candidates } },
      select: { lemma: true, pos: true, etymology: true, years: true, crossrefs: true },
    }),
  ]);

  if (matches.length === 0 && etyms.length === 0) {
    return NextResponse.json({ error: "未在词典中找到", query: raw }, { status: 404 });
  }

  // 按候选优先级排序：原词 > 全小写 > 其他
  const order = new Map(candidates.map((c, i) => [c, i]));
  matches.sort((a, b) => (order.get(a.lemma) ?? 999) - (order.get(b.lemma) ?? 999));

  // 词源：优先匹配 word.lemma；找不到取首个
  const word = matches[0] ?? null;
  const etymology = (word ? etyms.find((e) => e.lemma === word.lemma) : null) ?? etyms[0] ?? null;

  return NextResponse.json({
    word,
    etymology,
    alternates: matches.slice(1),
  });
}
