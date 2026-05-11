"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

type Props = {
  text: string;
  zhText: string | null;
  vocabSet: Set<string>;
  vocabDefByLemma: Record<string, string>;
  /** 当前句所有生词都答对时调用 */
  onAllCorrect: () => void;
  /** 点击非生词的英文词 → 打开词典弹窗（用户可加入生词） */
  onWordClick: (word: string) => void;
  /** key 变化重置内部状态（在切换句子时重新挂载） */
};

type Token =
  | { kind: "text"; value: string }
  | { kind: "word"; value: string; blankIdx?: number };

function tokenize(text: string, vocabSet: Set<string>): Token[] {
  const re = /([a-zA-Z]+(?:['-][a-zA-Z]+)*)/g;
  const out: Token[] = [];
  let last = 0;
  let blankCounter = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ kind: "text", value: text.slice(last, m.index!) });
    const word = m[0];
    if (vocabSet.has(word.toLowerCase())) {
      out.push({ kind: "word", value: word, blankIdx: blankCounter++ });
    } else {
      // 非生词：仍然是 word，但无 blankIdx → 渲染为可点击 button（加生词入口）
      out.push({ kind: "word", value: word });
    }
    last = m.index! + word.length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

export function PracticeSubtitle({
  text,
  zhText,
  vocabSet,
  vocabDefByLemma,
  onAllCorrect,
  onWordClick,
}: Props) {
  const tokens = useMemo(() => tokenize(text, vocabSet), [text, vocabSet]);
  const blanks = useMemo(
    () =>
      tokens.filter(
        (t): t is Token & { blankIdx: number } => t.kind === "word" && t.blankIdx !== undefined,
      ),
    [tokens],
  );
  const totalBlanks = blanks.length;

  // 状态：每个空的输入值、提示等级（0=无, 1=首字母, 2=定义, 3=答案）、是否答对
  const [inputs, setInputs] = useState<string[]>(() => Array(totalBlanks).fill(""));
  const [hints, setHints] = useState<number[]>(() => Array(totalBlanks).fill(0));
  const [correct, setCorrect] = useState<boolean[]>(() => Array(totalBlanks).fill(false));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // 切换到新句子时（text 变化）重置
  useEffect(() => {
    setInputs(Array(totalBlanks).fill(""));
    setHints(Array(totalBlanks).fill(0));
    setCorrect(Array(totalBlanks).fill(false));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [text, totalBlanks]);

  const allCorrectRef = useRef(false);
  useEffect(() => {
    if (totalBlanks === 0) return;
    if (correct.every((c) => c) && !allCorrectRef.current) {
      allCorrectRef.current = true;
      const t = setTimeout(() => {
        allCorrectRef.current = false;
        onAllCorrect();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [correct, totalBlanks, onAllCorrect]);

  const checkBlank = (i: number) => {
    if (correct[i]) return;
    const target = blanks[i].value.toLowerCase();
    const ans = inputs[i].trim().toLowerCase();
    if (!ans) return;
    if (ans === target) {
      setCorrect((c) => c.map((v, j) => (j === i ? true : v)));
    } else {
      // 答错 → 直接显示完整答案（不再分级提示）
      setHints((h) => h.map((v, j) => (j === i ? 3 : v)));
    }
  };

  const onChange = (i: number, value: string) => {
    setInputs((arr) => arr.map((v, j) => (j === i ? value : v)));
    // 长度等于答案长度时自动检查（用户键入完最后一个字符）
    const target = blanks[i].value;
    if (value.length === target.length) {
      // 延迟一拍让 React 状态更新
      setTimeout(() => {
        const ans = value.trim().toLowerCase();
        if (ans === target.toLowerCase()) {
          setCorrect((c) => c.map((v, j) => (j === i ? true : v)));
          // 自动跳到下一个空
          const next = inputRefs.current[i + 1];
          next?.focus();
        }
      }, 0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkBlank(i);
      // 如果对了，跳下一空
      if (inputs[i].trim().toLowerCase() === blanks[i].value.toLowerCase()) {
        inputRefs.current[i + 1]?.focus();
      }
    }
  };

  const hintFor = (i: number) => {
    if (hints[i] === 0 || correct[i]) return null;
    const target = blanks[i].value;
    const def = vocabDefByLemma[target.toLowerCase()];
    return def ? `答案：${target} · ${def}` : `答案：${target}`;
  };

  if (totalBlanks === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground italic mb-3 text-center">
          本句不含生词。点击下方任一英文词可加入生词本。
        </p>
        <p className="font-serif text-2xl leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-1">
          {tokens.map((t, i) =>
            t.kind === "text" ? (
              <span key={i}>{t.value}</span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => onWordClick(t.value)}
                title="点击查词 / 加生词"
                className="cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-200/70 hover:underline hover:decoration-dotted hover:underline-offset-4 dark:hover:bg-yellow-300/20 active:scale-[0.96]"
              >
                {t.value}
              </button>
            ),
          )}
        </p>
        {zhText && (
          <p className="mt-3 font-serif text-base text-muted-foreground/90 leading-relaxed border-t pt-3">
            {zhText}
          </p>
        )}
      </div>
    );
  }

  let blankCounter = 0;
  return (
    <div>
      <p className="font-serif text-2xl leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-2">
        {tokens.map((t, i) => {
          if (t.kind === "text") return <span key={i}>{t.value}</span>;
          // word: blank input or clickable button
          if (t.blankIdx === undefined) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onWordClick(t.value)}
                title="点击加生词"
                className="cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-200/60 hover:underline hover:decoration-dotted hover:underline-offset-4 dark:hover:bg-yellow-300/20 active:scale-[0.96]"
              >
                {t.value}
              </button>
            );
          }
          const bi = t.blankIdx;
          blankCounter++;
          const ok = correct[bi];
          const target = t.value;
          const width = `${Math.max(target.length * 0.7 + 1, 3)}rem`;
          return (
            <span key={i} className="inline-flex flex-col items-center">
              {ok ? (
                <span className="inline-flex items-center gap-1 px-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                  <Check className="h-4 w-4" />
                  {target}
                </span>
              ) : (
                <input
                  ref={(el) => {
                    inputRefs.current[bi] = el;
                  }}
                  type="text"
                  value={inputs[bi]}
                  onChange={(e) => onChange(bi, e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, bi)}
                  onBlur={() => checkBlank(bi)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={{ width }}
                  className="border-b-2 border-amber-400 bg-transparent px-1 text-center font-semibold font-sans focus:outline-none focus:border-emerald-500"
                />
              )}
            </span>
          );
        })}
      </p>

      {/* 每空提示（答错直接给完整答案 + 定义） */}
      <ul className="mt-3 space-y-1">
        {blanks.map((b, i) => {
          const h = hintFor(i);
          if (!h) return null;
          return (
            <li key={i} className="text-xs text-destructive">
              {blanks.length > 1 ? `[${i + 1}] ` : ""}{h}
            </li>
          );
        })}
      </ul>

      {zhText && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t pt-3">
          {zhText}
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Enter 或失焦自动检查
      </p>
    </div>
  );
}
