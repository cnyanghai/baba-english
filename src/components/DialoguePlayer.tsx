"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePersistedState } from "@/lib/usePersistedState";
import { ClickableSubtitle } from "@/components/ClickableSubtitle";
import { DialogueDrawer } from "@/components/DialogueDrawer";
import { PracticeSubtitle } from "@/components/PracticeSubtitle";
import { WordPopup } from "@/components/WordPopup";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  List,
  Repeat,
  Trophy,
  Volume2,
  EyeOff,
  Eye,
  PenLine,
  LogOut,
  Play,
  Pause,
} from "lucide-react";
import Link from "next/link";

type SubtitleMode = "hidden" | "en" | "zh" | "both";

type Dialogue = {
  id: number;
  index: number;
  startMs: number;
  endMs: number;
  enText: string;
  zhText: string | null;
};

type Props = {
  videoUrl: string;
  dialogues: Dialogue[];
  initialIdx: number;
  baseHref: string;
  episodeId: number;
  /** 含生词的句子 index 列表，用于抽屉中显示黄点标记 */
  vocabSentenceIdx?: number[];
  /** 每个 lemma（小写）对应它出现的句子 idx 列表 —— 练习模式 round-robin 用 */
  vocabIdxByLemma?: Record<string, number[]>;
  /** 用户的生词列表（lemma 原样，未小写） */
  vocabLemmas?: string[];
  /** lemma -> 第一条释义文本（用于填词答错时的提示） */
  vocabDefByLemma?: Record<string, string>;
  /** 是否已付费会员；未付费用户视频前 3 分钟试看 */
  isPaid?: boolean;
  /** 初始是否进入填词练习模式（由 /vocabulary 链接的 ?practice=1 触发） */
  initialPractice?: boolean;
};

const TRIAL_LIMIT_SEC = 600; // 未付费用户试看上限（10 分钟）

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const GAINS = [1, 1.5, 2, 3] as const; // 音量倍数（Web Audio gain），>1 用 GainNode 放大

const SUB_MODES: Array<{ value: SubtitleMode; label: string; key: string }> = [
  { value: "hidden", label: "隐", key: "1" },
  { value: "en", label: "英", key: "2" },
  { value: "zh", label: "中", key: "3" },
  { value: "both", label: "双", key: "4" },
];

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 在按 startMs 排序的 dialogues 中找当前时间所在句的索引（不在任何句中时返回最后一个 startMs<=t 的） */
function findIdxByTime(t: number, dialogues: Dialogue[]): number {
  let lo = 0,
    hi = dialogues.length - 1,
    best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const d = dialogues[mid];
    if (t < d.startMs) {
      hi = mid - 1;
    } else if (t > d.endMs) {
      best = mid;
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return best;
}

export function DialoguePlayer({
  videoUrl,
  dialogues,
  initialIdx,
  baseHref,
  episodeId,
  vocabSentenceIdx = [],
  vocabIdxByLemma = {},
  vocabLemmas = [],
  vocabDefByLemma = {},
  isPaid = false,
  initialPractice = false,
}: Props) {
  const [paywallShown, setPaywallShown] = useState(false);
  // 自建播放控件状态（替代浏览器内置 controls）
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // true = 用户主动跳转（点击 / 按键）→ seek + play；false = 时间追踪 → 不动视频
  // 初次挂载：idx > 0 表示用户进的是非首句（如继续学习 / 练习入口），需要 seek 过去；
  // idx === 0 则视为新视频从头看，不 seek（让用户看到片头）
  const intentionalJumpRef = useRef(initialIdx !== 0);

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState(initialPractice);
  const [practiceFinished, setPracticeFinished] = useState(false);
  // 工具栏「重复」开关：当前句循环（独立于 practice 填词模式）
  const [repeatMode, setRepeatMode] = useState(false);
  // WordPopup state（lift from ClickableSubtitle/PracticeSubtitle）
  const [wordPopupOpen, setWordPopupOpen] = useState(false);
  const [pickedWord, setPickedWord] = useState<string | null>(null);
  const wasPlayingBeforePopupRef = useRef(false);

  const handleWordClick = useCallback((word: string) => {
    setPickedWord(word);
    setWordPopupOpen(true);
  }, []);

  // v2: 升 storage key 强制所有用户从默认「双语对照」开始（baba 的核心学习模式）
  const [subMode, setSubMode] = usePersistedState<SubtitleMode>("baba.subMode.v2", "both");
  const [speedIndex, setSpeedIndex] = usePersistedState<number>("baba.speedIndex", 2);
  const [gainIndex, setGainIndex] = usePersistedState<number>("baba.gainIndex", 0); // 默认 1x
  const [occludeBottom, setOccludeBottom] = usePersistedState<boolean>("baba.occludeBottom", true); // 默认遮挡硬字幕

  // 本地维护：加生词后立即变色 + 当前句加入"含生词列表"，无需刷新页面
  const [vocabSet, setVocabSet] = useState<Set<string>>(
    () => new Set(vocabLemmas.map((l) => l.toLowerCase())),
  );
  const [vocabIdxSet, setVocabIdxSet] = useState<Set<number>>(
    () => new Set(vocabSentenceIdx),
  );

  const handleVocabAdded = useCallback(
    (lemma: string) => {
      const lower = lemma.toLowerCase();
      setVocabSet((prev) => {
        if (prev.has(lower)) return prev;
        const next = new Set(prev);
        next.add(lower);
        return next;
      });
      setVocabIdxSet((prev) => {
        if (prev.has(activeIdx)) return prev;
        const next = new Set(prev);
        next.add(activeIdx);
        return next;
      });
      // /vocabulary 页的 server cache 由 API endpoint 的 revalidatePath 失效，无需 router.refresh（避免 video 重载）
    },
    [activeIdx],
  );

  const handleVocabRemoved = useCallback(
    (lemma: string) => {
      const lower = lemma.toLowerCase();
      setVocabSet((prev) => {
        if (!prev.has(lower)) return prev;
        const next = new Set(prev);
        next.delete(lower);
        // 同步重算 vocabIdxSet：删该 lemma 后，扫一遍 dialogues 看哪些句还含其他 lemma
        const wordRe = /[a-zA-Z]+(?:['-][a-zA-Z]+)*/g;
        const nextIdx = new Set<number>();
        for (const d of dialogues) {
          const tokens = d.enText.toLowerCase().match(wordRe) ?? [];
          if (tokens.some((t) => next.has(t))) nextIdx.add(d.index);
        }
        setVocabIdxSet(nextIdx);
        return next;
      });
    },
    [dialogues],
  );

  const speed = SPEEDS[speedIndex] ?? 1;
  const gain = GAINS[gainIndex] ?? 1;
  const total = dialogues.length;
  const dialogue = dialogues[activeIdx];

  // 进度上报：累计真实播放时长（不算 seek/pause），每 10s 或 idx 变化时 PUT
  const lastSampledTimeRef = useRef<number>(0);
  const watchedDeltaRef = useRef<number>(0);
  const lastSaveAtRef = useRef<number>(0);

  const flushProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const delta = watchedDeltaRef.current;
    watchedDeltaRef.current = 0;
    lastSaveAtRef.current = Date.now();
    const body = {
      episodeId,
      lastIdx: activeIdx,
      lastTimeMs: Math.floor(v.currentTime * 1000),
      watchedMsDelta: Math.floor(delta),
    };
    // 401（未登录）/ 网络错误都吞掉，不影响播放
    fetch("/api/progress", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true, // 让 unmount/页面关闭时能把请求发出去
    }).catch(() => {});
  }, [episodeId, activeIdx]);

  // activeIdx 变化时立刻保存（保留最新位置）
  useEffect(() => {
    flushProgress();
  }, [activeIdx, flushProgress]);

  // 页面隐藏 / 关闭时保存
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushProgress();
    };
    const onUnload = () => flushProgress();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      flushProgress();
    };
  }, [flushProgress]);

  // URL 静默同步（不触发 Next.js 路由重渲染，但地址栏/分享/刷新可用）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = `${baseHref}/${activeIdx}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [activeIdx, baseHref]);

  // activeIdx 变化时：仅当用户主动跳转才 seek + play；时间追踪导致的不动视频
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!intentionalJumpRef.current) return;
    intentionalJumpRef.current = false;
    const seekAndPlay = () => {
      v.currentTime = dialogue.startMs / 1000;
      v.play().catch(() => {});
    };
    if (v.readyState >= 1) seekAndPlay();
    else v.addEventListener("loadedmetadata", seekAndPlay, { once: true });
  }, [activeIdx, dialogue.startMs]);

  // 同步速度
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // Web Audio gain 放大（HTML5 video.volume 上限是 1.0，要超过用 GainNode）
  // createMediaElementSource 一个 video 只能调一次 → 用 ref 守门
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioInitedRef = useRef(false);
  const initAudioGraph = useCallback(() => {
    if (audioInitedRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(v);
      const node = ctx.createGain();
      node.gain.value = gain;
      source.connect(node).connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = node;
      audioInitedRef.current = true;
    } catch {
      // 已初始化或浏览器不支持，忽略
    }
  }, [gain]);

  // gain 变化时同步到 GainNode
  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = gain;
  }, [gain]);

  // 视频开始播放时确保 audio graph 初始化（autoplay policy 通常需要用户交互后才行）
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      initAudioGraph();
      // resume context if suspended
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    v.addEventListener("play", onPlay);
    return () => v.removeEventListener("play", onPlay);
  }, [initAudioGraph]);

  // 字幕跟随视频时间自动滚动（连播）+ 练习模式循环当前句 + 累计观看时长 + 节流保存进度
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime * 1000;
      // 推进自建进度条
      setVideoCurrentTime(v.currentTime);

      // 试看墙：未付费用户超过 TRIAL_LIMIT_SEC 立即暂停 + 弹付费遮罩
      if (!isPaid && v.currentTime >= TRIAL_LIMIT_SEC) {
        v.pause();
        setPaywallShown(true);
        return;
      }

      // 累计真实播放时长：dt > 0 且 < 1s 才算（排除 seek/pause）
      const dtSec = v.currentTime - lastSampledTimeRef.current;
      if (dtSec > 0 && dtSec < 1) {
        watchedDeltaRef.current += dtSec * 1000;
      }
      lastSampledTimeRef.current = v.currentTime;

      const cur = dialogues[activeIdx];
      if (cur) {
        if (practiceMode || repeatMode) {
          // 练习 / 重复模式：循环当前句
          if (t >= cur.endMs) {
            v.currentTime = cur.startMs / 1000;
          }
        } else {
          // 连播：字幕跟随时间
          if (t < cur.startMs || t > cur.endMs + 50) {
            const newIdx = findIdxByTime(t, dialogues);
            if (newIdx !== activeIdx) {
              intentionalJumpRef.current = false;
              setActiveIdx(newIdx);
            }
          }
        }
      }

      // 每 10 秒落盘一次进度
      if (Date.now() - lastSaveAtRef.current > 10_000 && watchedDeltaRef.current > 1000) {
        flushProgress();
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [activeIdx, dialogues, flushProgress, practiceMode, repeatMode, isPaid]);

  const jumpTo = useCallback((newIdx: number) => {
    intentionalJumpRef.current = true;
    // 切句时关闭「重复」：用户换到新句已表示当前句听够了
    setRepeatMode(false);
    setActiveIdx(newIdx);
  }, []);
  const goPrev = useCallback(() => {
    if (activeIdx > 0) jumpTo(activeIdx - 1);
  }, [activeIdx, jumpTo]);
  const goNext = useCallback(() => {
    if (activeIdx + 1 < total) jumpTo(activeIdx + 1);
  }, [activeIdx, total, jumpTo]);

  // 练习模式 round-robin 队列：每个生词被练一次再循环，避免高频词霸屏
  // queueRef = 还有未练 idx 的 lemma 队列；ptrRef = 每个 lemma 的下一个未练 idx 指针
  const practiceQueueRef = useRef<string[]>([]);
  const practicePtrRef = useRef<Map<string, number>>(new Map());

  const initPracticeQueue = useCallback(() => {
    const q: string[] = [];
    const p = new Map<string, number>();
    for (const [lemma, idxes] of Object.entries(vocabIdxByLemma)) {
      if (idxes.length > 0) {
        q.push(lemma);
        p.set(lemma, 0);
      }
    }
    practiceQueueRef.current = q;
    practicePtrRef.current = p;
  }, [vocabIdxByLemma]);

  const jumpToNextVocabSentence = useCallback(() => {
    const q = practiceQueueRef.current;
    const p = practicePtrRef.current;
    if (q.length === 0) {
      setPracticeFinished(true);
      return;
    }
    const lemma = q[0];
    const list = vocabIdxByLemma[lemma] ?? [];
    const ptr = p.get(lemma) ?? 0;
    const idx = list[ptr];
    const newPtr = ptr + 1;
    p.set(lemma, newPtr);
    // lemma 还有未练 idx → 队尾排队；否则丢弃
    q.shift();
    if (newPtr < list.length) q.push(lemma);
    jumpTo(idx);
  }, [vocabIdxByLemma, jumpTo]);

  // "再练一遍" / 切到第一个练习句
  const restartPractice = useCallback(() => {
    setPracticeFinished(false);
    initPracticeQueue();
    jumpToNextVocabSentence();
  }, [initPracticeQueue, jumpToNextVocabSentence]);

  // 进入练习模式时初始化队列 + 跳到第一个练习句（避免停在当前不含生词的句子）
  const didInitPracticeRef = useRef(false);
  useEffect(() => {
    if (practiceMode && !didInitPracticeRef.current && !practiceFinished) {
      didInitPracticeRef.current = true;
      initPracticeQueue();
      // ref 已同步设置，下一行可以读到
      jumpToNextVocabSentence();
    }
    if (!practiceMode) didInitPracticeRef.current = false;
  }, [practiceMode, practiceFinished, initPracticeQueue, jumpToNextVocabSentence]);

  // 退出练习时也清掉完成提示
  useEffect(() => {
    if (!practiceMode) setPracticeFinished(false);
  }, [practiceMode]);

  // WordPopup 打开 → 暂停视频；关闭 → 恢复（如果之前在播）
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (wordPopupOpen) {
      wasPlayingBeforePopupRef.current = !v.paused;
      v.pause();
    } else if (wasPlayingBeforePopupRef.current) {
      v.play().catch(() => {});
      wasPlayingBeforePopupRef.current = false;
    }
  }, [wordPopupOpen]);
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // 过滤文本输入框 / textarea / contenteditable —— 但 input[type=range] 不算
      const isTextInput =
        t && (t.tagName === "TEXTAREA" || t.isContentEditable ||
          (t.tagName === "INPUT" && (t as HTMLInputElement).type !== "range"));
      if (isTextInput) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // video 聚焦时，浏览器内置 controls 会自己响应 Space，避免「我也 toggle 一次」造成正负抵消
      const isVideoFocused = t?.tagName === "VIDEO";
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault(); // 阻止 video / range 默认行为
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault(); // 阻止 video / range 默认行为
          goNext();
          break;
        case " ":
          if (isVideoFocused) return; // 由 video controls 自己处理
          e.preventDefault();
          // 词卡开着 → 关词卡（同时恢复播放，由 useEffect 处理）
          if (wordPopupOpen) {
            setWordPopupOpen(false);
          } else {
            togglePlay();
          }
          break;
        case "1":
          setSubMode("hidden");
          break;
        case "2":
          setSubMode("en");
          break;
        case "3":
          setSubMode("zh");
          break;
        case "4":
          setSubMode("both");
          break;
        case "[":
          setSpeedIndex((i) => Math.max(0, i - 1));
          break;
        case "]":
          setSpeedIndex((i) => Math.min(SPEEDS.length - 1, i + 1));
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, togglePlay, setSubMode, setSpeedIndex, wordPopupOpen]);

  const hasPrev = activeIdx > 0;
  const hasNext = activeIdx + 1 < total;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          // 自建控件 → 关闭浏览器内置 controls
          disablePictureInPicture
          preload="metadata"
          playsInline
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) v.play().catch(() => {});
            else v.pause();
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setVideoDuration((e.target as HTMLVideoElement).duration || 0)}
          onDurationChange={(e) => setVideoDuration((e.target as HTMLVideoElement).duration || 0)}
          // @ts-expect-error 微信 X5 / 华为浏览器私有属性
          x5-video-player-type="h5-page"
          // @ts-expect-error
          x5-playsinline="true"
          // @ts-expect-error
          webkit-playsinline="true"
          className="absolute inset-0 h-full w-full bg-black cursor-pointer"
        />
        {/* 遮挡硬字幕：贴底 13%（自建控件在视频区外，互不冲突） */}
        {occludeBottom && !paywallShown && (
          <div
            className="pointer-events-none absolute left-0 right-0 bottom-0 bg-black"
            style={{ height: "13%" }}
            title="遮挡视频内置硬字幕"
          />
        )}
        {/* 付费墙：未付费用户播到 3 分钟后弹出，覆盖整个视频区 */}
        {paywallShown && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-sm px-6">
            <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-card/95 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20">
              <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-3">
                免费试看 · 10 分钟
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight mb-2">
                继续观看请升级会员
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                解锁全部剧集 · 电影 · 词典 · 进度同步
              </p>
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-base text-muted-foreground line-through">¥298</span>
                <span className="font-serif text-4xl font-medium text-primary">¥168</span>
                <span className="text-sm text-muted-foreground">/ 年</span>
              </div>
              <a
                href="/upgrade"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition active:scale-[0.97] shadow-lg shadow-amber-500/30"
              >
                立即升级 → ¥168 / 年
              </a>
              <a
                href="/"
                className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground underline"
              >
                返回首页
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 自建播放控件：Play/Pause + 进度条 + 时间 */}
      <div className="flex items-center gap-2 sm:gap-3 px-1">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "暂停" : "播放"}
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90 transition shadow-md shadow-amber-500/30"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={videoDuration || 0}
          step={0.1}
          value={videoCurrentTime}
          onChange={(e) => {
            const v = videoRef.current;
            const t = Number(e.target.value);
            if (v) v.currentTime = t;
            setVideoCurrentTime(t);
          }}
          className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
          aria-label="视频进度"
        />
        <span className="shrink-0 text-[11px] sm:text-xs font-mono tabular-nums text-muted-foreground">
          {fmtMs(videoCurrentTime * 1000)} / {fmtMs(videoDuration * 1000)}
        </span>
      </div>

      {/* 工具栏：移动端 icon-only 单行；sm+ 显示文字 */}
      <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-1 sm:p-1.5 shadow-sm overflow-x-auto">
        {/* 字幕模式（4 按钮组）— 移动端用单字 */}
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5 shrink-0">
          {SUB_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSubMode(m.value)}
              title={`字幕：${m.label}（${m.key}）`}
              className={`px-2 sm:px-2.5 py-1 text-xs rounded transition active:scale-[0.96] ${
                subMode === m.value
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSpeedIndex((i) => (i + 1) % SPEEDS.length)}
          title="速度（[ / ]）"
          className="active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3"
        >
          <Gauge className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-xs">{speed}x</span>
          <span className="sm:hidden text-[10px] ml-0.5 tabular-nums">{speed}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setGainIndex((i) => (i + 1) % GAINS.length)}
          title="音量增益（>1 用 Web Audio 放大）"
          className="active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3"
        >
          <Volume2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-xs">{gain}x</span>
          <span className="sm:hidden text-[10px] ml-0.5 tabular-nums">{gain}</span>
        </Button>

        <Button
          variant={occludeBottom ? "default" : "ghost"}
          size="sm"
          onClick={() => setOccludeBottom((v) => !v)}
          title={occludeBottom ? "已遮挡视频内置硬字幕（点击关闭）" : "显示视频内置硬字幕（点击遮挡）"}
          className={`active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3 ${occludeBottom ? "bg-slate-700 hover:bg-slate-800 text-white" : ""}`}
        >
          {occludeBottom ? <EyeOff className="h-4 w-4 sm:mr-1" /> : <Eye className="h-4 w-4 sm:mr-1" />}
          <span className="hidden sm:inline text-xs">{occludeBottom ? "遮字幕" : "显字幕"}</span>
        </Button>

        <Button
          variant={repeatMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setRepeatMode((r) => !r)}
          title="重复播放当前句"
          className={`active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3 ${repeatMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
        >
          <Repeat className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-xs">{repeatMode ? "循环中" : "重复"}</span>
        </Button>

        {/* 练习开关（toggle）：默认「练习」，进入后显示「退出练习」 */}
        <Button
          variant={practiceMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setPracticeMode((p) => !p)}
          disabled={!practiceMode && vocabLemmas.length === 0}
          title={vocabLemmas.length === 0 ? "请先添加生词" : practiceMode ? "退出填词练习" : "进入填词练习"}
          className={`active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3 ${practiceMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
        >
          {practiceMode ? <LogOut className="h-4 w-4 sm:mr-1" /> : <PenLine className="h-4 w-4 sm:mr-1" />}
          <span className="hidden sm:inline text-xs">{practiceMode ? "退出练习" : "练习"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDrawerOpen(true)}
          title="句子列表"
          className="active:scale-[0.96] transition-transform shrink-0 px-2 sm:px-3"
        >
          <List className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-xs">句列表</span>
        </Button>

        <div className="ml-auto text-[11px] sm:text-xs text-muted-foreground tabular-nums font-mono px-1 sm:px-2 shrink-0">
          {activeIdx + 1}<span className="text-muted-foreground/40">/</span>{total}
        </div>
      </div>

      <DialogueDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        dialogues={dialogues}
        activeIdx={activeIdx}
        onSelect={(idx) => jumpTo(idx)}
        vocabSentenceIdx={vocabSentenceIdx}
        vocabSet={vocabSet}
      />

      {/* 字幕 */}
      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
        <div className="text-xs text-muted-foreground mb-3 tabular-nums flex items-center gap-2 flex-wrap">
          <span>
            {fmtMs(dialogue.startMs)} – {fmtMs(dialogue.endMs)}
          </span>
          {practiceMode && (
            <span className="rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-amber-700 dark:text-amber-400">
              填词练习 · 当前句循环
            </span>
          )}
        </div>
        {practiceMode && practiceFinished ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <Trophy className="h-12 w-12 text-amber-500" />
            <h3 className="text-lg font-semibold">本集所有生词已练完</h3>
            <p className="text-sm text-muted-foreground">
              {Object.keys(vocabIdxByLemma).filter((l) => (vocabIdxByLemma[l]?.length ?? 0) > 0).length} 个生词 · {vocabIdxSet.size} 个练习句，干得漂亮
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <Button variant="outline" onClick={restartPractice}>
                再练一遍
              </Button>
              <Button asChild variant="outline">
                <Link href="/vocabulary">看生词本</Link>
              </Button>
              <Button onClick={() => setPracticeMode(false)}>
                退出练习继续看
              </Button>
            </div>
          </div>
        ) : practiceMode ? (
          <PracticeSubtitle
            key={dialogue.id}
            text={dialogue.enText}
            zhText={dialogue.zhText}
            vocabSet={vocabSet}
            vocabDefByLemma={vocabDefByLemma}
            onAllCorrect={jumpToNextVocabSentence}
            onWordClick={handleWordClick}
          />
        ) : subMode === "hidden" ? (
          <p className="text-sm text-muted-foreground italic text-center pt-4">
            字幕已隐藏 — 按 1/2/3/4 切换显示
          </p>
        ) : (
          <>
            {(subMode === "en" || subMode === "both") && (
              <ClickableSubtitle
                key={dialogue.id}
                text={dialogue.enText}
                onWordClick={handleWordClick}
                vocabSet={vocabSet}
                className="font-serif text-lg sm:text-2xl leading-[1.45] tracking-tight"
              />
            )}
            {(subMode === "zh" || subMode === "both") && (
              <p
                className={`${subMode === "both" ? "mt-2 sm:mt-3" : ""} font-serif text-base sm:text-lg text-muted-foreground/90 leading-relaxed`}
              >
                {dialogue.zhText ?? "（中文翻译待补）"}
              </p>
            )}
          </>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="flex items-stretch gap-2 pt-1">
        <Button
          variant="outline"
          size="lg"
          className="aspect-square px-0"
          disabled={!hasPrev}
          onClick={goPrev}
          aria-label="上一句"
          title="上一句 (←)"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          className="flex-1 h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-amber-500/20"
          disabled={!hasNext}
          onClick={goNext}
        >
          <span className="flex items-center justify-center gap-2">
            <span>{hasNext ? "下一句" : "本集完"}</span>
            {hasNext && <ChevronRight className="h-5 w-5" />}
          </span>
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        快捷键： ← → 翻句 · Space 播放暂停 · 1-4 字幕 · [ ] 速度
      </p>

      {/* WordPopup（lift up）：所有字幕 / 练习里的词点击都打到这里 */}
      <WordPopup
        open={wordPopupOpen}
        onOpenChange={setWordPopupOpen}
        rawWord={pickedWord}
        sourceDialogueId={dialogue.id}
        onVocabAdded={handleVocabAdded}
        onVocabRemoved={handleVocabRemoved}
        vocabSet={vocabSet}
      />
    </div>
  );
}
