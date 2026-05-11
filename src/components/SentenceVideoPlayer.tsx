"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  startMs: number;
  endMs: number;
  /** 播到 endMs 后是否自动暂停。W3 会接入复读，目前先单次暂停 */
  pauseAtEnd?: boolean;
};

export function SentenceVideoPlayer({ src, startMs, endMs, pauseAtEnd = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  // 切换句子时，自动 seek 到起点
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const seek = () => {
      v.currentTime = startMs / 1000;
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
  }, [src, startMs]);

  // 播到 endMs 自动停
  useEffect(() => {
    if (!pauseAtEnd) return;
    const v = ref.current;
    if (!v) return;
    const onTime = () => {
      if (v.currentTime * 1000 >= endMs) v.pause();
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [endMs, pauseAtEnd]);

  return (
    <video
      ref={ref}
      src={src}
      controls
      preload="metadata"
      className="aspect-video w-full rounded-lg bg-black"
    />
  );
}
