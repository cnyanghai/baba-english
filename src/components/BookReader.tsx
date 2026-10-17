"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WordPopup } from "@/components/WordPopup";
import type { PictureBook } from "@/content/books/types";

type Props = {
  book: PictureBook;
  /** 初始页码（1-based，来自 ?p=） */
  initialPage?: number;
  /** 用户已加入生词本的 lemma（原样），用于高亮 */
  initialVocabLemmas?: string[];
};

const WORD_RE = /([a-zA-Z]+(?:['-][a-zA-Z]+)*)/g;
function tokenize(text: string): Array<{ w: boolean; v: string }> {
  const parts: Array<{ w: boolean; v: string }> = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(WORD_RE))) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ w: false, v: text.slice(last, idx) });
    parts.push({ w: true, v: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ w: false, v: text.slice(last) });
  return parts;
}

// 小图标（内联，与预览一致）
const IcEye = () => (
  <svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></svg>
);
const IcSparkle = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2l1.6 8.4L22 12l-8.4 1.6L12 22l-1.6-8.4L2 12l8.4-1.6z" /></svg>
);
const IcSpeaker = () => (
  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3z" /><path d="M16 8a5 5 0 0 1 0 8" /></svg>
);
const IcStop = () => (
  <svg className="fill" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
);
const IcChevL = () => <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>;
const IcChevR = () => <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>;
const IcArrow = () => <svg viewBox="0 0 24 24"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;

export function BookReader({ book, initialPage = 1, initialVocabLemmas = [] }: Props) {
  const total = book.pages.length;
  const clamp = useCallback((n: number) => Math.min(Math.max(n, 1), total), [total]);

  const [page, setPage] = useState(() => clamp(initialPage));
  const [closed, setClosed] = useState(() => clamp(initialPage) <= 1);
  const [showZh, setShowZh] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [readingIdx, setReadingIdx] = useState(-1);
  const [turnCls, setTurnCls] = useState<"" | "turn-out" | "turn-in">("");
  const animatingRef = useRef(false);

  const [vocabSet, setVocabSet] = useState<Set<string>>(
    () => new Set(initialVocabLemmas.map((l) => l.toLowerCase())),
  );
  const [wordPopupOpen, setWordPopupOpen] = useState(false);
  const [pickedWord, setPickedWord] = useState<string | null>(null);

  const p = book.pages[page - 1];

  // ── 朗读（浏览器 speechSynthesis） ──
  const stopRead = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setReadingIdx(-1);
  }, []);

  const speakPage = useCallback(
    (pageNum: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const pg = book.pages[pageNum - 1];
      if (!pg) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      setPlaying(true);
      const last = pg.sentences.length - 1;
      pg.sentences.forEach((s, i) => {
        const u = new SpeechSynthesisUtterance(s.en);
        u.lang = "en-US";
        u.rate = 0.85;
        u.onstart = () => setReadingIdx(i);
        u.onend = () => {
          if (i === last) {
            setPlaying(false);
            setReadingIdx(-1);
          }
        };
        synth.speak(u);
      });
    },
    [book.pages],
  );

  const toggleRead = useCallback(() => {
    if (playing) stopRead();
    else speakPage(page);
  }, [playing, stopRead, speakPage, page]);

  // ── 翻页 ──
  const turn = useCallback(
    (d: number) => {
      if (animatingRef.current) return;
      const n = clamp(page + d);
      if (n === page) return;
      stopRead();
      const reduce =
        typeof window !== "undefined" &&
        (window.matchMedia("(max-width:640px)").matches ||
          window.matchMedia("(prefers-reduced-motion:reduce)").matches);
      if (reduce) {
        setPage(n);
        setShowZh(false);
        setTimeout(() => speakPage(n), 150);
        return;
      }
      animatingRef.current = true;
      setTurnCls("turn-out");
      setTimeout(() => {
        setPage(n);
        setShowZh(false);
        setTurnCls("turn-in");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setTurnCls("")),
        );
        setTimeout(() => {
          animatingRef.current = false;
          speakPage(n);
        }, 360);
      }, 300);
    },
    [page, clamp, stopRead, speakPage],
  );

  const openBook = useCallback(() => {
    setClosed(false);
    setTimeout(() => speakPage(page), 260);
  }, [speakPage, page]);

  const handleWordClick = useCallback(
    (w: string) => {
      stopRead();
      setPickedWord(w);
      setWordPopupOpen(true);
    },
    [stopRead],
  );

  const handleVocabAdded = useCallback((lemma: string) => {
    setVocabSet((prev) => {
      const lower = lemma.toLowerCase();
      if (prev.has(lower)) return prev;
      const next = new Set(prev);
      next.add(lower);
      return next;
    });
  }, []);
  const handleVocabRemoved = useCallback((lemma: string) => {
    setVocabSet((prev) => {
      const lower = lemma.toLowerCase();
      if (!prev.has(lower)) return prev;
      const next = new Set(prev);
      next.delete(lower);
      return next;
    });
  }, []);

  // URL 同步 ?p=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = `/books/${book.slug}?p=${page}`;
    if (window.location.pathname + window.location.search !== t) {
      window.history.replaceState(null, "", t);
    }
  }, [page, book.slug]);

  // 预载相邻页
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const n of [page - 1, page + 1]) {
      const pg = book.pages[n - 1];
      if (pg) {
        const im = new window.Image();
        im.src = pg.image;
      }
    }
  }, [page, book.pages]);

  // 键盘 ← →（书封时 → / Enter 翻开）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (closed) {
        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          openBook();
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        turn(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        turn(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closed, openBook, turn]);

  // 卸载停朗读
  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    },
    [],
  );

  const isLast = page === total;

  return (
    <div className="bookwrap mx-auto max-w-6xl px-4 py-5 sm:py-6">
      <div className="topline">
        <Link href="/books">
          <ArrowLeft className="h-4 w-4" />
          绘本
        </Link>
        <span className="pgno tabular-nums">
          {page} / {total}
        </span>
      </div>

      <div className="stage">
        <div className={`book ${closed ? "closed" : ""}`}>
          <div className={`spread ${turnCls}`}>
            {/* 左：满幅插图 */}
            <div className="side pg-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={page} src={p.image} alt={p.alt} />
            </div>
            <div className="spine" />
            {/* 右：纸页 */}
            <div className="side pg-paper">
              <div className="paper-pad">
                <div className="paper-head">
                  <span className="story-title">{book.titleZh}</span>
                  <button
                    type="button"
                    className={`yiwen ${showZh ? "on" : ""}`}
                    onClick={() => setShowZh((v) => !v)}
                    title="显示 / 隐藏中文"
                  >
                    <IcEye />
                    译文
                  </button>
                </div>
                <div className="paper-body">
                  <p className="bk-en">
                    {p.sentences.map((s, i) => (
                      <span key={i} className={`sp ${readingIdx === i ? "read" : ""}`}>
                        {tokenize(s.en).map((t, j) =>
                          t.w ? (
                            // 用 <span> 而非 <button>：button 是原子内联盒，会在词与紧跟标点间产生换行机会
                            <span
                              key={j}
                              className={`w${vocabSet.has(t.v.toLowerCase()) ? " vocab" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWordClick(t.v);
                              }}
                            >
                              {t.v}
                            </span>
                          ) : (
                            <span key={j}>{t.v}</span>
                          ),
                        )}
                        {i < p.sentences.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </p>
                  <div className="divider">
                    <span className="l" />
                    <IcSparkle />
                    <span className="r" />
                  </div>
                  <p className={`bk-zh ${showZh ? "" : "hide"}`}>
                    {p.sentences.map((s) => s.zh).join("")}
                  </p>
                  <button
                    type="button"
                    className={`listen ${playing ? "playing" : ""}`}
                    onClick={toggleRead}
                  >
                    <span className="dot">{playing ? <IcStop /> : <IcSpeaker />}</span>
                    <small>{playing ? "停止" : "朗读"}</small>
                  </button>
                </div>
                <div className="paper-foot">
                  <button
                    type="button"
                    className="nb"
                    disabled={page === 1}
                    onClick={() => turn(-1)}
                  >
                    <IcChevL />
                    上一页
                  </button>
                  <span className="pgno-in">
                    {page} / {total}
                  </span>
                  <button
                    type="button"
                    className="nb next"
                    disabled={isLast}
                    onClick={() => turn(1)}
                  >
                    {isLast ? "读完啦" : "下一页"}
                    {!isLast && <IcChevR />}
                  </button>
                </div>
              </div>
            </div>

            {/* 书封 */}
            {closed && (
              <div className="cover-face">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={book.cover} alt={book.titleEn} />
                <div className="cover-inner">
                  <p className="lab">Baba 英语 · 绘本</p>
                  <h1>
                    {book.titleZh}
                    <em>{book.titleEn}</em>
                  </h1>
                  <p>{book.blurb}</p>
                  <button type="button" className="open-btn" onClick={openBook}>
                    翻开这本书 <IcArrow />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="tip">← → 翻页 · 点单词查词 · 「译文」看中文 · 翻页自动朗读</p>

      <WordPopup
        open={wordPopupOpen}
        onOpenChange={setWordPopupOpen}
        rawWord={pickedWord}
        onVocabAdded={handleVocabAdded}
        onVocabRemoved={handleVocabRemoved}
        vocabSet={vocabSet}
      />
    </div>
  );
}
