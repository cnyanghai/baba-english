import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBook } from "@/content/books";
import { BookReader } from "@/components/BookReader";

type PageProps = {
  params: { slug: string };
  searchParams: { p?: string };
};

export function generateMetadata({ params }: PageProps): Metadata {
  const book = getBook(params.slug);
  if (!book) return { title: "绘本 · Baba 英语" };
  return {
    title: `${book.titleZh} · 英语绘本`,
    description: book.blurb,
  };
}

export default async function BookPage({ params, searchParams }: PageProps) {
  const book = getBook(params.slug);
  if (!book) notFound();

  const parsed = Number.parseInt(searchParams.p ?? "1", 10);
  const initialPage = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  // 已登录用户：拉生词 lemma 用于高亮（不阻塞游客阅读）
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  let vocabLemmas: string[] = [];
  if (userId) {
    const vocab = await prisma.userVocabulary.findMany({
      where: { userId },
      select: { wordLemma: true },
    });
    vocabLemmas = vocab.map((v) => v.wordLemma);
  }

  return (
    <BookReader
      book={book}
      initialPage={initialPage}
      initialVocabLemmas={vocabLemmas}
    />
  );
}
