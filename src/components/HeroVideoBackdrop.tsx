"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  videoSrc: string;
  fallbackPoster: string | null;
};

/** 首页 Hero 的活视频背景：mute + autoplay + loop。
 * 出错或浏览器拒绝自动播放时，自动 fallback 到模糊海报。
 */
export function HeroVideoBackdrop({ videoSrc, fallbackPoster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => setVideoOk(false));
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      {videoOk ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onError={() => setVideoOk(false)}
          className="absolute inset-0 h-full w-full object-cover scale-105 opacity-55"
        />
      ) : (
        fallbackPoster && (
          <Image
            src={fallbackPoster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-110 opacity-50 blur-2xl"
          />
        )
      )}
      {/* 半透明渐变蒙层：让文字在任何画面上都可读 */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/70 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/0 to-background" />
    </div>
  );
}
