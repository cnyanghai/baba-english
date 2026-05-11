"use client";

import { useEffect, useState } from "react";

/**
 * 跨页面持久化 useState（基于 localStorage）。
 *
 * SSR 安全：初始用默认值渲染，挂载后异步从 localStorage 加载。
 * 关键：用 state（而非 ref）控制 hydrated，确保持久化 effect
 * 在第一次成功 hydration 之后才运行 — 否则挂载时会用默认值
 * 覆盖上一次保存的值。
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // 损坏数据忽略
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 配额满 / 隐私模式忽略
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
