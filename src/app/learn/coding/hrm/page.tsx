import Link from "next/link";
import type { Metadata } from "next";
import { hrmLevels } from "@/content/paths/hrm";
import { ArrowLeft, ChevronRight, Coffee } from "lucide-react";

export const metadata: Metadata = {
  title: "Human Resource Machine 关卡攻略 · Baba",
  description:
    "HRM 全 41 关逐关攻略：每关目标 + 可直接照抄的解法代码 + 讲解。解法经权威解法库核准。",
};

export default function HRMWalkthroughPage() {
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
          Human Resource Machine · 关卡攻略
        </p>
        <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-balance sm:text-4xl">
          关卡<span className="text-emerald-500">逐关攻略</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          HRM 把编程扒到最裸：你只有搬运、跳转、判断几条命令，却要拼出解法。这里每一关给你目标、可直接照抄的解法代码、和它为什么这样写。解法均经权威解法库核准。全 41 关（第 5、15、18、27、33 关为剧情过场，无代码）。后期关卡（乘除、排序、质因数分解…）已进入正经算法，难度陡增，可当进阶挑战。
        </p>
      </section>

      {/* Levels */}
      <main className="pt-6">
        {hrmLevels.map((l, i) => {
          if (l.coffee) {
            return (
              <details
                key={l.n}
                id={`lv${l.n}`}
                className="group mb-3 overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 opacity-90 [scroll-margin-top:60px]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-open:rotate-90" />
                  <span className="rounded-md border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] text-emerald-500">
                    第 {l.n} 关
                  </span>
                  <span className="font-serif text-lg font-medium">
                    {l.zh}
                    <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground/60">{l.en}</span>
                  </span>
                  <span className="ml-auto rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground/60">
                    过场
                  </span>
                </summary>
                <div className="border-t border-border px-5 pb-4 pt-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    {l.goal}
                  </p>
                </div>
              </details>
            );
          }
          return (
            <details
              key={l.n}
              id={`lv${l.n}`}
              open={i === 0}
              className="group mb-3 overflow-hidden rounded-2xl border border-border bg-card/50 [scroll-margin-top:60px]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-open:rotate-90" />
                <span className="rounded-md border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] text-emerald-500">
                  第 {l.n} 关
                </span>
                <span className="font-serif text-lg font-medium">
                  {l.zh}
                  <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground/60">{l.en}</span>
                </span>
                <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] text-amber-500 max-sm:hidden">
                  {l.concept}
                </span>
              </summary>

              <div className="border-t border-border px-4 pb-5 pt-1 sm:px-5">
                <div className="mt-3">
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">目标</div>
                  <p className="text-[15px]">{l.goal}</p>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">解法</div>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-background/70 p-3.5 font-mono text-[13px] leading-relaxed text-emerald-500">
{l.code}
                  </pre>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/60">讲解</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{l.expl}</p>
                </div>
              </div>
            </details>
          );
        })}
      </main>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-sm leading-relaxed">
        <p>
          <span className="font-medium text-emerald-500">怎么用　</span>
          卡住了再来看。先自己试，真想不出再照解法抄一遍，重点是读懂「讲解」里它为什么这样写——比抄答案更重要的是弄懂那一步。解法参考 cowboy/human-resource-machine-solutions。
        </p>
      </div>
    </div>
  );
}
