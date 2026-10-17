import Link from "next/link";
import type { Metadata } from "next";
import { swiftIntro, swiftBooks, swiftAdvanced, type SwiftModule } from "@/content/paths/swift";
import { ArrowLeft, ChevronRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Swift Playgrounds 通关路线 · Baba",
  description:
    "Swift Playgrounds 逐章攻略：Learn to Code 1（命令→函数→循环→条件→算法）、Learn to Code 2（变量→类型→初始化→参数→建造世界→数组），到走向真实 App。每章给学习目标、真实 Swift 命令、通关思路和小技巧。",
};

function ModuleCard({ m, bookId, open }: { m: SwiftModule; bookId: string; open: boolean }) {
  return (
    <details
      open={open}
      id={`${bookId}-${m.n}`}
      className="group mb-3 overflow-hidden rounded-2xl border border-border bg-card/50 [scroll-margin-top:60px]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-open:rotate-90" />
        <span className="rounded-md border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] text-emerald-500">
          第 {m.n} 章
        </span>
        <span className="font-serif text-lg font-medium">
          {m.zh}
          <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground/60">{m.en}</span>
        </span>
        <span className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-500 max-sm:hidden">
          {m.concept}
        </span>
      </summary>

      <div className="border-t border-border px-4 pb-5 pt-1 sm:px-5">
        <div className="mt-3">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">学什么</div>
          <p className="text-[15px]">{m.learn}</p>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">关键命令</div>
          <pre className="overflow-x-auto rounded-lg border border-border bg-background/70 p-3.5 font-mono text-[13px] leading-relaxed text-emerald-500">
{m.commands}
          </pre>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">通关思路</div>
          <p className="text-sm leading-relaxed text-muted-foreground">{m.strategy}</p>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-3.5">
          <span className="shrink-0 rounded-md bg-amber-500 px-2 py-0.5 font-mono text-[11px] text-black">小技巧</span>
          <p className="text-sm">{m.tip}</p>
        </div>
      </div>
    </details>
  );
}

export default function SwiftGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      {/* Hero */}
      <section className="border-b border-border py-12 sm:py-14">
        <Link
          href="/learn/coding"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          编程学习路线图
        </Link>
        <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-emerald-500">
          <span className="h-px w-6 bg-emerald-500/50" />
          Swift Playgrounds · 通关路线
        </p>
        <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-balance sm:text-4xl">
          Swift Playgrounds <span className="text-emerald-500">通关路线</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{swiftIntro.blurb}</p>
        <a
          href={swiftIntro.appHref}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-sm font-medium text-emerald-500 transition hover:bg-emerald-500/20"
        >
          打开 / 下载 Swift Playgrounds
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* Books */}
      <main className="pt-4">
        {swiftBooks.map((book, bi) => (
          <section key={book.id} className="pt-6">
            <div className="mb-1 flex items-baseline gap-3">
              <h2 className="font-serif text-2xl font-medium tracking-tight">{book.titleZh}</h2>
              <span className="font-mono text-xs text-muted-foreground/60">{book.seriesEn}</span>
            </div>
            <p className="mb-5 max-w-xl text-sm text-muted-foreground">{book.blurb}</p>
            {book.modules.map((m, mi) => (
              <ModuleCard key={m.n} m={m} bookId={book.id} open={bi === 0 && mi === 0} />
            ))}
          </section>
        ))}
      </main>

      {/* 进阶：LTC3 / 做 App */}
      <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
        <div className="mb-1 flex items-baseline gap-3">
          <h2 className="font-serif text-xl font-medium">{swiftAdvanced.titleZh}</h2>
          <span className="font-mono text-xs text-muted-foreground/60">{swiftAdvanced.seriesEn}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{swiftAdvanced.note}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {swiftAdvanced.points.map((p) => (
            <li key={p} className="relative pl-5 text-sm before:absolute before:left-0 before:text-emerald-500 before:content-['›']">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
