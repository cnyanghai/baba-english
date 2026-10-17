import Link from "next/link";
import type { Metadata } from "next";
import { cs50Episodes } from "@/content/paths/cs50";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "CS50 用 Scratch 学编程 · 九集课件 · Baba",
  description:
    "哈佛 CS50 九集 Scratch 课，每集配中文课件：本集学什么、核心概念、要认识的积木、跟着做的例子、动手练、一句话带走。视频自托管、页内直接看。",
};

function SecHead({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h3 className="mt-6 mb-3 flex items-center gap-2.5 border-b border-border pb-2 text-[13px] font-semibold tracking-wide">
      <span className="rounded border border-amber-500/40 px-1.5 py-px font-mono text-[11px] text-amber-500">
        {n}
      </span>
      {children}
    </h3>
  );
}

export default function CS50CoursewarePage() {
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
        <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-amber-500">
          <span className="h-px w-6 bg-amber-500/50" />
          CS50 · 用 Scratch 学编程 · 九集课件
        </p>
        <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-balance sm:text-4xl">
          看视频不够，<span className="text-amber-500">还要有讲义</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          哈佛 CS50 专门给零基础做的九集 Scratch 课。每集配一份中文课件：本集学什么、核心概念、要认识哪些积木、跟着视频做哪些例子、一个动手练、一句话带走。视频自托管、页内直接看。
        </p>
        <span className="mt-5 inline-block rounded-lg border border-border px-3 py-2 font-mono text-[11px] text-muted-foreground/80">
          课程与例子来自 <span className="text-muted-foreground">Harvard CS50</span>，依 CC BY-NC-SA 4.0 授权自托管改写 · 本页免费
        </span>
      </section>

      {/* Episodes */}
      <main className="pt-6">
        {cs50Episodes.map((e, i) => (
          <details
            key={e.n}
            open={i === 0}
            className="group mb-3 overflow-hidden rounded-2xl border border-border bg-card/50 [scroll-margin-top:60px]"
            id={`ep${e.n}`}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-open:rotate-90" />
              <span className="rounded-md border border-amber-500/40 px-2 py-0.5 font-mono text-[11px] text-amber-500">
                第 {e.n} 集
              </span>
              <span className="font-serif text-lg font-medium">
                {e.zh}
                <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground/60">{e.en}</span>
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground/60">{e.dur}</span>
            </summary>

            <div className="border-t border-border px-4 pb-6 pt-1 sm:px-5">
              {/* 概念标签 */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {e.concepts.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-500"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* 视频（自托管 R2，页内直接播）+ 中英双语字幕轨（同源 VTT） */}
              <video
                controls
                preload="none"
                playsInline
                className="mt-4 aspect-video w-full rounded-xl border border-border bg-black"
              >
                <source src={e.videoUrl} type="video/mp4" />
                <track
                  kind="subtitles"
                  src={`/cs50-subs/week-${String(e.n).padStart(2, "0")}.vtt`}
                  srcLang="zh"
                  label="中英双语"
                  default
                />
              </video>
              <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                字幕：英文为 CS50 官方字幕，中文为机器翻译（点播放器字幕按钮开关）
              </p>

              <SecHead n="01">本集学什么</SecHead>
              <ul className="flex flex-col gap-2">
                {e.objectives.map((o) => (
                  <li key={o} className="relative pl-5 text-[15px]">
                    <span className="absolute left-0 top-[0.55em] h-[7px] w-[7px] rounded-[2px] border-[1.5px] border-emerald-500" />
                    {o}
                  </li>
                ))}
              </ul>

              <SecHead n="02">核心概念</SecHead>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {e.conceptCards.map((c) => (
                  <div key={c.term} className="rounded-lg border border-border bg-background/40 p-3">
                    <b className="mb-1 block text-sm">{c.term}</b>
                    <span className="text-[13px] text-muted-foreground">{c.gloss}</span>
                  </div>
                ))}
              </div>

              <SecHead n="03">认识这些积木</SecHead>
              <div className="flex flex-col gap-2">
                {e.blocks.map((b) => (
                  <div key={b.cat} className="grid grid-cols-[6rem_1fr] items-baseline gap-3 max-sm:grid-cols-1 max-sm:gap-0.5">
                    <span className="font-mono text-[13px] text-amber-500">{b.cat}</span>
                    <span className="font-mono text-[13px] leading-relaxed text-muted-foreground">{b.list}</span>
                  </div>
                ))}
              </div>

              <SecHead n="04">跟着做（视频里的例子）</SecHead>
              <ul className="flex flex-col gap-1.5">
                {e.examples.map((ex) => (
                  <li key={ex.name} className="relative pl-4 text-sm text-muted-foreground before:absolute before:left-0 before:text-amber-500 before:content-['›']">
                    <b className="font-semibold text-foreground">{ex.name}</b> — {ex.desc}
                  </li>
                ))}
              </ul>

              {/* 动手练 */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-3.5">
                <span className="shrink-0 rounded-md bg-amber-500 px-2 py-0.5 font-mono text-[11px] text-black">动手练</span>
                <p className="text-sm">{e.practice}</p>
              </div>
              {/* 一句话带走 */}
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] p-3.5">
                <span className="shrink-0 rounded-md bg-emerald-500 px-2 py-0.5 font-mono text-[11px] text-black">一句话带走</span>
                <p className="text-sm">{e.takeaway}</p>
              </div>

              {/* 官方大纲 */}
              <details className="group/ch mt-4 border-t border-dashed border-border pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground/70 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-3 w-3 text-amber-500 transition group-open/ch:rotate-90" />
                  官方大纲 · 跳转时间戳
                </summary>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {e.chapters.map((c) => (
                    <li key={c.ts} className="grid grid-cols-[48px_1fr] items-baseline gap-2.5 text-[13px] text-muted-foreground">
                      <span className="rounded bg-amber-500/10 py-px text-center font-mono text-[11.5px] text-amber-500">{c.ts}</span>
                      <span>{c.title}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </details>
        ))}
      </main>

      <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm leading-relaxed">
        <b className="text-amber-500">关于版权</b>　视频与例子出自 Harvard CS50「Introduction to Programming with Scratch」，采用 CC BY-NC-SA 4.0：署名、非商用、相同方式共享。本课件为中文改写，保持免费。
      </div>
    </div>
  );
}
