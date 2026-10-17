import type { PictureBook } from "./types";
import { hpOpening } from "./hp-opening";

// 绘本清单（静态）。新绘本在这里追加。
const BOOKS: PictureBook[] = [hpOpening];

export function listBooks(): PictureBook[] {
  return BOOKS;
}

export function getBook(slug: string): PictureBook | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export type { PictureBook, BookPage, BookSentence } from "./types";
