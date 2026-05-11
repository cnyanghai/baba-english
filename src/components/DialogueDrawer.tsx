"use client";

import { useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Dialogue = {
  id: number;
  index: number;
  startMs: number;
  endMs: number;
  enText: string;
  zhText: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogues: Dialogue[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  /** 含生词的句子 index 列表，标黄点 */
  vocabSentenceIdx?: number[];
  /** 生词 lemma 集合（小写），用于高亮句中具体单词 */
  vocabSet?: Set<string>;
};

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 把英文句子中匹配 vocabSet 的单词用黄底高亮 */
function renderHighlighted(text: string, vocabSet: Set<string>) {
  if (vocabSet.size === 0) return text;
  const re = /([a-zA-Z]+(?:['-][a-zA-Z]+)*)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) {
      parts.push(<span key={key++}>{text.slice(last, m.index!)}</span>);
    }
    const word = m[0];
    if (vocabSet.has(word.toLowerCase())) {
      parts.push(
        <span
          key={key++}
          className="bg-amber-200 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100 px-0.5 rounded font-semibold"
        >
          {word}
        </span>,
      );
    } else {
      parts.push(<span key={key++}>{word}</span>);
    }
    last = m.index! + word.length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

export function DialogueDrawer({
  open,
  onOpenChange,
  dialogues,
  activeIdx,
  onSelect,
  vocabSentenceIdx = [],
  vocabSet = new Set<string>(),
}: Props) {
  const activeRowRef = useRef<HTMLButtonElement>(null);
  const vocabIdxSet = new Set(vocabSentenceIdx);

  // 打开时自动滚动到当前句
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      activeRowRef.current?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    }, 50);
    return () => clearTimeout(t);
  }, [open, activeIdx]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center justify-between">
            <span>本集句子（{dialogues.length}）</span>
            {vocabIdxSet.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                含生词 {vocabIdxSet.size}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {dialogues.map((d) => {
            const isActive = d.index === activeIdx;
            const hasVocab = vocabIdxSet.has(d.index);
            return (
              <button
                key={d.id}
                ref={isActive ? activeRowRef : undefined}
                type="button"
                onClick={() => {
                  onSelect(d.index);
                  onOpenChange(false);
                }}
                className={`w-full text-left px-4 py-3 border-b transition-colors ${
                  isActive
                    ? "bg-amber-50 dark:bg-amber-900/15 border-l-4 border-l-primary"
                    : "hover:bg-accent border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className={`flex items-center gap-1.5 text-xs tabular-nums ${isActive ? "text-amber-700 dark:text-amber-400 font-semibold" : "text-muted-foreground"}`}>
                    #{d.index + 1}
                    {hasVocab && (
                      <span
                        className="h-2 w-2 rounded-full bg-amber-500"
                        title="含你生词本里的词"
                      />
                    )}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {fmtMs(d.startMs)}
                  </span>
                </div>
                <p className={`font-serif text-[15px] leading-snug ${isActive ? "font-medium" : ""}`}>
                  {renderHighlighted(d.enText, vocabSet)}
                </p>
                {d.zhText && (
                  <p className="mt-1 font-serif text-xs text-muted-foreground leading-snug truncate">
                    {d.zhText}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
