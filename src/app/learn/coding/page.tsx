import Link from "next/link";
import type { Metadata } from "next";
import { codingStages, type PathResource } from "@/content/paths/coding";
import { Play, Gamepad2, TerminalSquare, ArrowRight, ArrowUpRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "少儿编程学习路线图 · Baba",
  description:
    "给孩子的编程学习路线图，公开可借鉴：用哈佛 CS50 的 Scratch 课启蒙，用闯关游戏理解程序逻辑，再上手真实工具。视频自托管、每集有大纲、每关有攻略。",
};

/** 看/引导 = 琥珀；玩·练（游戏/交互站）= 绿 */
function ResourceIcon({ kind }: { kind: PathResource["kind"] }) {
  if (kind === "video")
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-500">
        <Play className="h-4 w-4" />
      </span>
    );
  if (kind === "game")
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
        <Gamepad2 className="h-4 w-4" />
      </span>
    );
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
      <TerminalSquare className="h-4 w-4" />
    </span>
  );
}

function ResourceCard({ r }: { r: PathResource }) {
  const inner = (
    <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card/60 p-4 transition hover:border-border/80 hover:bg-card sm:p-5">
      <ResourceIcon kind={r.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-medium">{r.titleZh}</span>
          {r.titleEn && (
            <span className="font-mono text-xs text-muted-foreground/60">{r.titleEn}</span>
          )}
          {r.external && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${
              r.free
                ? "border-emerald-500/40 text-emerald-500"
                : "border-amber-500/40 text-amber-500"
            }`}
          >
            {r.free ? "免费" : "付费"}
          </span>
          <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {r.lang}
          </span>
          {r.tags?.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.note}</p>
        {r.href && (
          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-amber-500">
            {r.external ? "去这个网站" : r.kind === "video" ? "看课件" : "看攻略"}
            {r.external ? <ArrowUpRight className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
          </span>
        )}
      </div>
    </div>
  );

  if (!r.href) return inner;
  if (r.external)
    return (
      <a href={r.href} target="_blank" rel="noreferrer noopener" className="group block">
        {inner}
      </a>
    );
  return (
    <Link href={r.href} className="group block">
      {inner}
    </Link>
  );
}

export default function CodingPathPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      {/* Hero */}
      <section className="border-b border-border py-12 sm:py-16">
        <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-amber-500">
          <span className="h-px w-6 bg-amber-500/50" />
          公开 · 欢迎借鉴
        </p>
        <h1 className="font-serif text-4xl font-medium leading-[1.14] tracking-tight text-balance sm:text-5xl">
          给孩子的<span className="text-amber-500">编程学习路线图</span>
          <br />
          从玩游戏，到写代码
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          用哈佛 CS50 的 Scratch 课启蒙、用闯关游戏理解程序逻辑、再上手真实工具。视频自托管、每集有大纲、每关有攻略。全程标注了「为什么这样排」，公开出来，任何人都可以照着走，或改成自己的。
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 px-3 py-1 font-mono text-amber-500">
            <Play className="h-3 w-3" />看 · 引导
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-3 py-1 font-mono text-emerald-500">
            <Gamepad2 className="h-3 w-3" />玩 · 练
          </span>
        </div>
      </section>

      {/* Stages */}
      <main className="pt-4">
        {codingStages.map((stage) => (
          <section key={stage.n} className="border-b border-dashed border-border py-8 last:border-none">
            <div className="mb-1.5 flex items-baseline gap-3.5">
              <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground/70">
                阶段 {stage.n}
              </span>
              <h2 className="font-serif text-2xl font-medium tracking-tight">{stage.title}</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              目标：<span className="font-mono text-[13px] text-emerald-500">{stage.goalConcepts}</span>
            </p>
            <div className="flex flex-col gap-3">
              {stage.resources.map((r) => (
                <ResourceCard key={r.id} r={r} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer note */}
      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-sm">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p className="leading-relaxed text-foreground/90">
          <span className="font-medium text-emerald-500">这条路是公开的。</span>{" "}
          欢迎任何家长、老师照着走，或改成自己的版本。CS50 视频依 CC BY-NC-SA 自托管、保持免费。
        </p>
      </div>
    </div>
  );
}
