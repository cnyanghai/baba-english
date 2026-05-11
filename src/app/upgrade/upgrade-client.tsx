"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import type { Plan } from "@/lib/plans";

type Props = { plans: Plan[]; promo: boolean };

type OrderState =
  | { phase: "idle" }
  | { phase: "creating"; planCode: string }
  | { phase: "scan"; planCode: string; orderId: string; qrDataUrl: string; amountFen: number }
  | { phase: "paid" }
  | { phase: "error"; message: string };

export function UpgradeClient({ plans, promo }: Props) {
  const router = useRouter();
  const [state, setState] = useState<OrderState>({ phase: "idle" });

  async function startPay(planCode: string) {
    setState({ phase: "creating", planCode });
    try {
      const res = await fetch("/api/pay/wechat/native", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planCode }),
      });
      const data = (await res.json()) as { error?: string; orderId?: string; codeUrl?: string; amountFen?: number };
      if (!res.ok || !data.orderId || !data.codeUrl) {
        setState({ phase: "error", message: data.error ?? "下单失败" });
        return;
      }
      const qrDataUrl = await QRCode.toDataURL(data.codeUrl, { margin: 2, width: 280 });
      setState({ phase: "scan", planCode, orderId: data.orderId, qrDataUrl, amountFen: data.amountFen ?? 0 });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "网络异常" });
    }
  }

  useEffect(() => {
    if (state.phase !== "scan") return;
    let stopped = false;
    const orderId = state.orderId;
    const tick = async () => {
      if (stopped) return;
      try {
        const r = await fetch(`/api/pay/order/${orderId}`);
        const d = (await r.json()) as { status?: string };
        if (d.status === "paid") {
          setState({ phase: "paid" });
          return;
        }
      } catch {}
      if (!stopped) setTimeout(tick, 1500);
    };
    const t = setTimeout(tick, 1500);
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, [state.phase, state.phase === "scan" ? state.orderId : null]);

  // 支付成功 3 秒后自动跳首页
  useEffect(() => {
    if (state.phase !== "paid") return;
    const t = setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [state.phase, router]);

  if (state.phase === "paid") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center">
        <p className="font-serif text-2xl text-emerald-400 mb-4">支付成功 ✓</p>
        <p className="text-sm text-muted-foreground mb-6">已解锁全部内容，3 秒后返回首页…</p>
        <a
          href="/"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          立即返回
        </a>
      </div>
    );
  }

  if (state.phase === "scan") {
    return (
      <div className="rounded-xl border bg-card p-8 text-center max-w-md mx-auto">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
          微信扫码支付
        </p>
        <p className="font-serif text-4xl font-medium mb-6">¥{(state.amountFen / 100).toFixed(2)}</p>
        <img
          src={state.qrDataUrl}
          alt="微信支付二维码"
          className="mx-auto h-64 w-64 rounded-lg bg-white p-3"
        />
        <p className="mt-6 text-xs text-muted-foreground">
          打开微信 → 扫一扫 → 完成支付，本页自动跳转
        </p>
        <button
          onClick={() => setState({ phase: "idle" })}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
        >
          取消并返回
        </button>
      </div>
    );
  }

  // 单卡（年卡）— 居中突出
  const plan = plans[0];
  const yuanNow = (plan.amountFen / 100).toFixed(0);
  const yuanOriginal = (plan.originalFen / 100).toFixed(0);
  const perDay = (plan.amountFen / 100 / plan.durationDays).toFixed(2);
  const isCreating = state.phase === "creating";

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-8 text-center shadow-lg shadow-amber-500/10">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          {plan.label} · {plan.durationDays} 天
        </p>

        <div className="flex items-baseline justify-center gap-3 mb-1">
          {promo && (
            <span className="text-lg text-muted-foreground line-through">¥{yuanOriginal}</span>
          )}
          <span className="font-serif text-6xl font-medium text-primary">¥{yuanNow}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-8">折合 ¥{perDay} / 天</p>

        <button
          disabled={isCreating}
          onClick={() => startPay(plan.code)}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition active:scale-[0.97] disabled:opacity-60 shadow-lg shadow-amber-500/30"
        >
          {isCreating ? "正在生成订单…" : "微信扫码支付"}
        </button>

        <ul className="mt-8 space-y-2 text-left text-sm text-muted-foreground">
          <li>✓ 全部美剧 / 电影 / 动画</li>
          <li>✓ 单词点击翻译 + 词源</li>
          <li>✓ 填词练习 + 进度同步</li>
          <li>✓ 每周新增内容</li>
        </ul>
      </div>

      {state.phase === "error" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
    </div>
  );
}
