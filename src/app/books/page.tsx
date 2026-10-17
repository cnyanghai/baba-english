import Link from "next/link";
import { listBooks } from "@/content/books";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "英语绘本 · Baba 英语",
  description: "自己做的英语绘本：左图右文，点词查词，点句看中文，逐句朗读。",
};

export default function BooksPage() {
  const books = listBooks();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-[10px] font-mono tracking-[0.4em] text-amber-500/70 uppercase mb-4">
          Picture Books
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight">
          英语绘本
        </h1>
        <p className="mt-3 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          一页一幅画，一页一段英文。点单词查词、加进生词本，点句子看中文，还能逐句听标准发音。
          像读故事一样，把英语读进去。
        </p>
      </header>

      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <p className="text-sm text-muted-foreground">绘本准备中…</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {books.map((b) => (
            <Link
              key={b.slug}
              href={`/books/${b.slug}`}
              className="group block transition-transform duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
            >
              <div className="relative aspect-[1122/1402] overflow-hidden rounded-xl border border-border/40 shadow-lg shadow-black/30 transition-shadow group-hover:shadow-2xl group-hover:shadow-amber-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.cover}
                  alt={b.titleEn}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-mono text-white/80 backdrop-blur-sm">
                    <BookOpen className="h-3 w-3" />
                    {b.level}
                  </span>
                </div>
              </div>
              <div className="mt-3 px-0.5">
                <h3 className="font-serif text-base font-medium tracking-tight truncate">
                  {b.titleZh}
                </h3>
                <p className="mt-0.5 font-display text-xs text-muted-foreground truncate">
                  {b.titleEn}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70 truncate">
                  {b.source}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
