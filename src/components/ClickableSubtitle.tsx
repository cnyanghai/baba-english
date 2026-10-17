"use client";

type Props = {
  text: string;
  /** WordPopup state 上提到 DialoguePlayer，这里只发事件 */
  onWordClick: (word: string) => void;
  /** 已加入生词本的词集合（小写 lemma），用于显示生词高亮 */
  vocabSet?: Set<string>;
  className?: string;
};

function tokenize(text: string) {
  const re = /([a-zA-Z]+(?:['-][a-zA-Z]+)*)/g;
  const parts: Array<{ kind: "word" | "text"; value: string }> = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push({ kind: "text", value: text.slice(last, m.index!) });
    parts.push({ kind: "word", value: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

export function ClickableSubtitle({ text, onWordClick, vocabSet, className }: Props) {
  const tokens = tokenize(text);
  return (
    <p className={className}>
      {tokens.map((t, i) => {
        if (t.kind === "text") return <span key={i}>{t.value}</span>;
        const isVocab = vocabSet?.has(t.value.toLowerCase()) ?? false;
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              // 阻止冒泡：避免同时触发外层「点句看中文」等父级点击
              e.stopPropagation();
              onWordClick(t.value);
            }}
            title={isVocab ? "已在生词本（点击查词）" : "点击查词"}
            className={
              isVocab
                ? "cursor-pointer rounded px-0.5 transition-colors active:scale-[0.96] bg-amber-500/15 text-amber-600 dark:text-amber-400 underline decoration-amber-500/70 decoration-dotted underline-offset-4 hover:bg-amber-500/25"
                : "cursor-pointer rounded px-0.5 transition-colors active:scale-[0.96] hover:bg-yellow-200/70 hover:underline hover:decoration-dotted hover:underline-offset-4 dark:hover:bg-yellow-300/20"
            }
          >
            {t.value}
          </button>
        );
      })}
    </p>
  );
}
