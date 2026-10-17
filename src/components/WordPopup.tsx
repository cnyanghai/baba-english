"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Volume2, BookmarkPlus, BookmarkMinus, Check, AlertCircle, X } from "lucide-react";

type Definition = { pos: string; def: string };
type WordData = {
  lemma: string;
  ipa: string | null;
  definitions: Definition[];
  freq: number | null;
};
type EtymData = {
  lemma: string;
  pos: string | null;
  etymology: string;
  years: number[];
  crossrefs: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawWord: string | null;
  /** 来源句 id（看剧场景传 dialogue.id；绘本等无 dialogue 的场景可省略，服务端存 null） */
  sourceDialogueId?: number | null;
  /** 加入生词本成功后回调（lemma 是 server 返回的标准化形式） */
  onVocabAdded?: (lemma: string) => void;
  /** 从生词本移除成功后回调 */
  onVocabRemoved?: (lemma: string) => void;
  /** 已在生词本的 lemma 集合（小写）。lookup 用于显示「已加入」状态 */
  vocabSet?: Set<string>;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: WordData; etym: EtymData | null }
  | { kind: "notFound"; query: string }
  | { kind: "error"; msg: string };

export function WordPopup({ open, onOpenChange, rawWord, sourceDialogueId, onVocabAdded, onVocabRemoved, vocabSet }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [adding, setAdding] = useState<
    "none" | "busy" | "added" | "removing" | "removed" | "needLogin" | "err"
  >("none");
  const [etymOpen, setEtymOpen] = useState(false);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !rawWord) return;
    setAdding("none");
    setEtymOpen(false);
    setState({ kind: "loading" });
    const word = rawWord.replace(/[^a-zA-Z'-]/g, "");
    fetch(`/api/words/${encodeURIComponent(word)}`)
      .then(async (r) => {
        if (r.status === 404) {
          const j = await r.json().catch(() => ({}));
          setState({ kind: "notFound", query: j.query ?? word });
          return;
        }
        if (!r.ok) {
          setState({ kind: "error", msg: `查询失败 (${r.status})` });
          return;
        }
        const j = (await r.json()) as { word: WordData; etymology: EtymData | null };
        setState({ kind: "ok", data: j.word, etym: j.etymology });
      })
      .catch((e) => setState({ kind: "error", msg: e?.message ?? "网络错误" }));
  }, [open, rawWord]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const addToVocab = async (lemma: string) => {
    setAdding("busy");
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wordLemma: lemma, sourceDialogueId }),
      });
      if (res.status === 401) {
        setAdding("needLogin");
        return;
      }
      if (!res.ok) {
        setAdding("err");
        return;
      }
      setAdding("added");
      onVocabAdded?.(lemma);
    } catch {
      setAdding("err");
    }
  };

  const removeFromVocab = async (lemma: string) => {
    setAdding("removing");
    try {
      const res = await fetch(`/api/vocabulary?wordLemma=${encodeURIComponent(lemma)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        setAdding("needLogin");
        return;
      }
      if (!res.ok) {
        setAdding("err");
        return;
      }
      setAdding("removed");
      onVocabRemoved?.(lemma);
    } catch {
      setAdding("err");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop（dim + blur，点击关闭） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            aria-hidden
          />

          {/* Card（spring 弹出） */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(420px,90vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* 关闭按钮（右上角） */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="关闭"
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted hover:text-foreground transition active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 pt-7">
                {state.kind === "loading" && (
                  <div>
                    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">查询中</p>
                    <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{rawWord}</p>
                    <div className="mt-6 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                )}

                {state.kind === "notFound" && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-widest mb-3">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Not Found
                    </div>
                    <p className="font-serif text-3xl font-medium tracking-tight">{state.query}</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      词典里没有这个词。可能是变形 / 专有名词 / 拼写错误。
                    </p>
                  </div>
                )}

                {state.kind === "error" && (
                  <div>
                    <p className="font-serif text-2xl font-medium">出错了</p>
                    <p className="mt-2 text-sm text-muted-foreground">{state.msg}</p>
                  </div>
                )}

                {state.kind === "ok" && (
                  <>
                    {/* 单词 hero */}
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-serif text-4xl font-medium tracking-tight truncate">
                          {state.data.lemma}
                        </h2>
                        {state.data.ipa && (
                          <p className="mt-1 font-mono text-sm text-muted-foreground">
                            /{state.data.ipa}/
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => speak(state.data.lemma)}
                        title="朗读"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition active:scale-90"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 释义 */}
                    <ul className="space-y-2 mt-5 border-t border-border/40 pt-4">
                      {state.data.definitions.map((d, i) => (
                        <li key={i} className="text-[15px] leading-relaxed flex gap-3">
                          {d.pos && (
                            <span className="inline-block min-w-[2.5rem] font-mono text-xs text-amber-500 dark:text-amber-400 pt-1.5">
                              {d.pos}
                            </span>
                          )}
                          <span className="flex-1 font-serif">{d.def}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 词源 */}
                    {state.etym && (
                      <div className="mt-4 border-t border-border/40 pt-3">
                        <button
                          type="button"
                          onClick={() => setEtymOpen((v) => !v)}
                          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition"
                        >
                          <span
                            className="inline-block w-3 text-center transition-transform"
                            style={{ transform: etymOpen ? "rotate(90deg)" : "rotate(0)" }}
                          >▸</span>
                          词源 · Etymology
                          {state.etym.years.length > 0 && (
                            <span className="text-muted-foreground/70 font-normal">
                              ({state.etym.years[0]} 起)
                            </span>
                          )}
                        </button>
                        <AnimatePresence initial={false}>
                          {etymOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 rounded-lg bg-muted/40 border border-border/30 p-3.5 text-xs leading-relaxed">
                                {state.etym.pos && (
                                  <span className="font-mono text-amber-500 mr-2">
                                    {state.etym.pos}.
                                  </span>
                                )}
                                <span className="font-serif text-foreground/90 text-[13px]">
                                  {state.etym.etymology}
                                </span>
                                {state.etym.crossrefs.length > 0 && (
                                  <div className="mt-2 text-muted-foreground">
                                    相关：{state.etym.crossrefs.join(" · ")}
                                  </div>
                                )}
                                <div className="mt-2 text-[10px] text-muted-foreground/60 italic">
                                  数据来源：etymonline.com
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* 加/移生词本 — 已在生词本时按钮变为「移出」 */}
                    {(() => {
                      const inVocab =
                        adding === "added" ||
                        ((vocabSet?.has(state.data.lemma.toLowerCase()) ?? false) && adding !== "removed");
                      const busy = adding === "busy" || adding === "removing";
                      return (
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                          {adding === "needLogin" ? (
                            <a
                              href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? location.pathname : "/")}`}
                              className="text-xs text-primary underline"
                            >
                              登录后才能加生词本
                            </a>
                          ) : adding === "err" ? (
                            <span className="text-xs text-destructive">操作失败，请重试</span>
                          ) : adding === "removed" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                              <Check className="h-3.5 w-3.5" />
                              已移出生词本
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground tabular-nums font-mono">
                              {state.data.freq ? `freq · #${state.data.freq}` : ""}
                            </span>
                          )}
                          {inVocab ? (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => removeFromVocab(state.data.lemma)}
                              variant="outline"
                              className="active:scale-[0.96] transition text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                            >
                              {adding === "removing" ? (
                                "移出中…"
                              ) : (
                                <>
                                  <BookmarkMinus className="mr-1 h-4 w-4" />
                                  移出生词本
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => addToVocab(state.data.lemma)}
                              variant="default"
                              className="active:scale-[0.96] transition"
                            >
                              {adding === "busy" ? (
                                "加入中…"
                              ) : (
                                <>
                                  <BookmarkPlus className="mr-1 h-4 w-4" />
                                  加入生词本
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
