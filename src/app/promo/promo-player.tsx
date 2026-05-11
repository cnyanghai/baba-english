"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react";
import Link from "next/link";

const HERO_VIDEO = "https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev/hero/loop.mp4";
const BG_MUSIC = "https://pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev/promo/welcome-to-the-show.mp3";
const TOTAL_SEC = 30;

// 场景定义（30 秒紧凑节奏，适合抖音）
const SCENES = [
  { id: "hook", start: 0, end: 3 },
  { id: "wordcard", start: 3, end: 10 },
  { id: "practice", start: 10, end: 17 },
  { id: "punchline", start: 17, end: 23 },
  { id: "price", start: 23, end: 27 },
  { id: "cta", start: 27, end: 30 },
] as const;

type SceneId = (typeof SCENES)[number]["id"];

function useTimeline(playing: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    // 基于 wall-clock 计算实际经过时间，setInterval 间隔抖动不会累积误差
    const startTime = Date.now() - t * 1000;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= TOTAL_SEC) {
        setT(TOTAL_SEC);
        clearInterval(id);
      } else {
        setT(elapsed);
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  return [t, setT] as const;
}

export function PromoPlayer() {
  // ?headless=1 → 录屏专用：跳过点击 overlay，直接静音自动播（音乐 ffmpeg 后期混入）
  const isHeadless = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("headless") === "1";

  const [playing, setPlaying] = useState(isHeadless); // headless 模式直接开播
  const [muted, setMuted] = useState(isHeadless);     // headless 模式默认静音
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [t, setT] = useTimeline(playing);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 挂载时尝试自动播音乐；浏览器拦截则进入「等用户点一下」状态
  // headless 录屏模式跳过此逻辑（playing 已经初始 true、声音由 ffmpeg 后期混）
  useEffect(() => {
    if (isHeadless) return;
    const a = audioRef.current;
    if (!a) {
      setPlaying(true);
      return;
    }
    a.play()
      .then(() => setPlaying(true))
      .catch(() => setNeedsUserGesture(true));
  }, [isHeadless]);

  // 视频 + 音乐随播放/暂停同步
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (playing) {
      v?.play().catch(() => {});
      a?.play().catch(() => {});
    } else {
      v?.pause();
      a?.pause();
    }
  }, [playing]);

  // 音乐音量：背景音乐 50%，57s 后开始淡出
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (t < 57) {
      a.volume = muted ? 0 : 0.5;
    } else {
      const fadeProgress = Math.min(1, (t - 57) / 3);
      a.volume = muted ? 0 : 0.5 * (1 - fadeProgress);
    }
  }, [t, muted]);

  const currentScene: SceneId =
    (SCENES.find((s) => t >= s.start && t < s.end)?.id) ?? "cta";

  const finished = t >= TOTAL_SEC;

  function restart() {
    setT(0);
    setPlaying(true);
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-foreground overflow-hidden">
      {/* 背景：HP loop 视频（带烧录字幕，下方 15% 遮挡条挡住） */}
      <video
        ref={videoRef}
        src={HERO_VIDEO}
        muted
        loop
        playsInline
        autoPlay
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      {/* 底部遮挡条：挡住 HP 视频自带的中英烧录字幕（约占视频底部 13%） */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-black z-[5]"
        style={{ height: "15%" }}
      />
      {/* 背景音乐：默认静音 (autoplay 浏览器限制)，点 unmute 才出声 */}
      <audio
        ref={audioRef}
        src={BG_MUSIC}
        autoPlay
        loop
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/95" />

      {/* 顶部进度条（headless 录屏时隐藏） */}
      {!isHeadless && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
          <motion.div
            className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
            style={{ width: `${(t / TOTAL_SEC) * 100}%` }}
          />
        </div>
      )}

      {/* 顶部控件（headless 录屏时隐藏） */}
      {!isHeadless && (
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setMuted((m) => !m)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/80 hover:bg-black/80 transition"
          aria-label={muted ? "取消静音" : "静音"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/80 hover:bg-black/80 transition"
          aria-label={playing ? "暂停" : "播放"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <button
          onClick={restart}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/80 hover:bg-black/80 transition"
          aria-label="重新播放"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      )}

      {/* 左下角 Logo */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <span
          aria-hidden
          className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/40"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-black/85 fill-current">
            <path d="M8 5.5v13L19 12 8 5.5Z" />
          </svg>
        </span>
        <span className="font-bold tracking-tight text-white/90">
          Baba<span className="text-white/50 ml-1 font-normal">英语</span>
        </span>
      </div>

      {/* 时间码（headless 录屏时隐藏） */}
      {!isHeadless && (
      <div className="absolute bottom-4 right-4 z-30 font-mono text-xs tabular-nums text-white/40">
        {Math.floor(t).toString().padStart(2, "0")} / {TOTAL_SEC}
      </div>
      )}

      {/* 等用户点击解锁声音（浏览器 autoplay 政策） */}
      {needsUserGesture && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            const a = audioRef.current;
            a?.play().catch(() => {});
            setNeedsUserGesture(false);
            setPlaying(true);
          }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", damping: 18, stiffness: 240 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/60 mb-6"
          >
            <Play className="h-9 w-9 ml-1 text-black/85 fill-current" />
          </motion.div>
          <p className="font-serif text-2xl sm:text-3xl text-white mb-2">点击开始</p>
          <p className="text-sm text-white/60 font-mono tracking-wider">click to start with sound</p>
        </motion.button>
      )}

      {/* 场景层 */}
      <AnimatePresence mode="wait">
        {currentScene === "hook" && <SceneHook key="hook" />}
        {currentScene === "wordcard" && <SceneWordCard key="wordcard" t={t} sceneStart={3} />}
        {currentScene === "practice" && <ScenePractice key="practice" t={t} sceneStart={10} />}
        {currentScene === "punchline" && <ScenePunchline key="punchline" t={t} sceneStart={17} />}
        {currentScene === "price" && <ScenePrice key="price" />}
        {currentScene === "cta" && <SceneCTA key="cta" finished={finished} />}
      </AnimatePresence>
    </div>
  );
}

/* ── 场景 1 · 钩子（0-5s） ─────────────────── */
function SceneHook() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-serif text-3xl sm:text-5xl text-white/95 leading-relaxed"
      >
        学了 <span className="text-amber-500 font-display tabular-nums">10</span> 年英语
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-6 font-serif text-3xl sm:text-5xl text-white/95"
      >
        看美剧还是要字幕？
      </motion.p>
    </motion.div>
  );
}

/* ── 场景 2 · 看视频学英语（5-15s） ─────── */
function SceneVideo({ t }: { t: number }) {
  const local = t - 5;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-amber-500 mb-8"
      >
        Watch · Listen · Understand
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="font-display text-5xl sm:text-7xl font-bold text-amber-500 mb-6 tracking-tight"
        style={{ textShadow: "0 4px 32px rgba(245,158,11,0.4)" }}
      >
        Harry Potter
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: local > 2 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl text-center"
      >
        <p className="font-serif text-xl sm:text-3xl text-white leading-relaxed">
          看 Harry Potter
        </p>
        <p className="font-serif text-xl sm:text-3xl text-white/80 leading-relaxed mt-1">
          听 Harry Potter
        </p>
        <p className="font-serif text-xl sm:text-3xl text-amber-300 leading-relaxed mt-1 font-medium">
          懂 Harry Potter
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── 场景 3 · 词卡演示（15-25s） ───────── */
function SceneWordCard({ t, sceneStart }: { t: number; sceneStart: number }) {
  const local = t - sceneStart;
  const sentenceShown = local > 0.3;
  const popupShown = local > 1.6;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-amber-500 mb-6"
      >
        点哪个词都能查
      </motion.p>

      {/* 字幕（生词高亮） */}
      <AnimatePresence>
        {sentenceShown && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-2xl sm:text-4xl text-white/95 leading-[1.5] max-w-3xl text-center mb-3"
          >
            She is{" "}
            <span className="bg-amber-500/20 text-amber-300 px-1.5 rounded underline decoration-amber-500/60 decoration-dotted underline-offset-4">
              ravenous
            </span>{" "}
            for the adventure
          </motion.p>
        )}
      </AnimatePresence>
      {sentenceShown && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="font-serif text-base sm:text-xl text-white/55 mb-12"
        >
          她对冒险渴望至极
        </motion.p>
      )}

      {/* 词卡 */}
      <AnimatePresence>
        {popupShown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="w-[min(420px,90vw)] rounded-2xl border border-amber-500/30 bg-black/85 backdrop-blur-2xl shadow-2xl shadow-amber-500/20 p-6"
          >
            <h3 className="font-serif text-4xl font-medium tracking-tight text-white">
              ravenous
            </h3>
            <p className="mt-1 font-mono text-sm text-white/50">/ˈrævənəs/</p>
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <li className="text-sm leading-relaxed flex gap-3">
                <span className="inline-block min-w-[2.5rem] font-mono text-xs text-amber-500 pt-1.5">adj.</span>
                <span className="flex-1 font-serif text-white/90">极度饥饿的，贪婪的</span>
              </li>
              <li className="text-sm leading-relaxed flex gap-3">
                <span className="inline-block min-w-[2.5rem] font-mono text-xs text-amber-500 pt-1.5">adj.</span>
                <span className="flex-1 font-serif text-white/90">渴望的，热切的</span>
              </li>
            </ul>
            <div className="mt-3 border-t border-white/10 pt-3 text-xs text-amber-500/80">
              ▸ 词源 · Etymology <span className="text-white/40 ml-1">(15c. from Old French)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── 场景 4 · 填词练习（25-35s） ────────── */
function ScenePractice({ t, sceneStart }: { t: number; sceneStart: number }) {
  const local = t - sceneStart;
  // 模拟键入 ravenous 的过程
  const typingStart = 1;
  const typingEnd = 4;
  const target = "ravenous";
  const charCount =
    local < typingStart
      ? 0
      : local > typingEnd
        ? target.length
        : Math.floor(((local - typingStart) / (typingEnd - typingStart)) * target.length);
  const typed = target.slice(0, charCount);
  const correct = local > typingEnd + 0.3;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-amber-500 mb-10"
      >
        填词练习 · 把生词练到肌肉记忆
      </motion.p>

      <p className="font-serif text-2xl sm:text-4xl text-white/95 leading-[1.5] max-w-3xl text-center">
        She is{" "}
        {!correct ? (
          <span className="relative inline-block">
            <span className="font-semibold text-amber-300 border-b-2 border-amber-400 px-2">
              {typed || " "}
            </span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -right-0.5 top-0 w-[2px] h-full bg-amber-400"
            />
          </span>
        ) : (
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 px-2 rounded bg-emerald-500/20 text-emerald-300 font-semibold"
          >
            ✓ ravenous
          </motion.span>
        )}{" "}
        for the adventure
      </p>

      <AnimatePresence>
        {correct && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-base sm:text-lg text-emerald-300 font-mono"
          >
            ✓ 自动跳到下一句
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── 场景 5 · 三条 punchline（35-45s） ──── */
function ScenePunchline({ t, sceneStart }: { t: number; sceneStart: number }) {
  const local = t - sceneStart;
  const lines = [
    { text: "不是背单词 App", visible: local > 0.3 },
    { text: "不是网课", visible: local > 1.7 },
    { text: "是看真实剧集，让英语自己长出来", visible: local > 3, highlight: true },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 gap-6 sm:gap-10"
    >
      {lines.map((l, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: l.visible ? 1 : 0, x: l.visible ? 0 : -40 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`flex items-center gap-4 font-serif text-2xl sm:text-5xl tracking-tight ${
            l.highlight ? "text-amber-300 font-medium" : "text-white/85"
          }`}
        >
          <span className={l.highlight ? "text-amber-500" : "text-white/30"}>✓</span>
          {l.text}
        </motion.p>
      ))}
    </motion.div>
  );
}

/* ── 场景 6 · 价格（45-55s） ──────────────── */
function ScenePrice() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-amber-500 mb-4"
      >
        首发活动价 · 限时
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex items-baseline gap-4"
      >
        <span className="font-display text-3xl sm:text-5xl text-white/40 line-through tabular-nums">
          ¥298
        </span>
        <span
          className="font-display text-7xl sm:text-9xl font-bold text-amber-500 tabular-nums"
          style={{ textShadow: "0 8px 64px rgba(245,158,11,0.5)" }}
        >
          ¥168
        </span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-6 font-serif text-xl sm:text-2xl text-white/85"
      >
        一年解锁全部内容
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="mt-2 text-sm sm:text-base text-white/50 font-mono"
      >
        美剧 · 电影 · 动画 · TED · 词典 · 进度同步
      </motion.p>
    </motion.div>
  );
}

/* ── 场景 7 · CTA（55-60s） ──────────────── */
function SceneCTA({ finished }: { finished: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 240 }}
        className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/50 mb-6"
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-black/85 fill-current">
          <path d="M8 5.5v13L19 12 8 5.5Z" />
        </svg>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-white"
      >
        Baba <span className="text-white/60 font-normal">英语</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-4 font-mono text-lg sm:text-2xl text-amber-500 tracking-wider"
      >
        baba.wogucloud.cn
      </motion.p>
      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-lg bg-amber-500 px-8 text-base font-medium text-black hover:bg-amber-400 transition active:scale-[0.97] shadow-lg shadow-amber-500/40"
          >
            立即开始 →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
