import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { wordLemma?: string; sourceDialogueId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const wordLemma = body.wordLemma?.trim();
  if (!wordLemma) {
    return NextResponse.json({ error: "缺少单词" }, { status: 400 });
  }

  // 确认词典里存在
  const word = await prisma.word.findUnique({ where: { lemma: wordLemma } });
  if (!word) {
    return NextResponse.json({ error: "词典里没有这个词" }, { status: 404 });
  }

  // upsert：已加过的不算错
  const item = await prisma.userVocabulary.upsert({
    where: { userId_wordLemma: { userId, wordLemma } },
    create: {
      userId,
      wordLemma,
      sourceDialogueId: body.sourceDialogueId ?? null,
    },
    update: {}, // 已存在时不更新
  });

  // 失效生词本页 router cache（不影响当前播放页）
  revalidatePath("/vocabulary");

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wordLemma = url.searchParams.get("wordLemma");
  if (!wordLemma) {
    return NextResponse.json({ error: "缺少 wordLemma 参数" }, { status: 400 });
  }

  await prisma.userVocabulary.deleteMany({ where: { userId, wordLemma } });
  revalidatePath("/vocabulary");
  return NextResponse.json({ ok: true });
}
