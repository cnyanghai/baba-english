import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlans, isPromoActive, PROMO_END } from "@/lib/plans";
import { UpgradeClient } from "./upgrade-client";
import { Crown, Check } from "lucide-react";

const BENEFITS = [
  "全部美剧 / 电影 / 动画无限观看",
  "单词点击翻译 + 词源解析",
  "填词练习 + 跨设备进度同步",
  "生词本无限收录",
  "每周新增内容自动解锁",
  "字幕模式自由切换 + 速度 / 音量增益",
];

export default async function UpgradePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?next=/upgrade");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isPaid = !!(user?.paidUntil && user.paidUntil > new Date());

  // 已付费 → 显示会员权益面板，不显示扫码
  if (isPaid && user?.paidUntil) {
    const daysLeft = Math.ceil((user.paidUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-8 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="font-serif text-2xl font-medium tracking-tight">Baba 会员</h1>
              <p className="text-xs text-muted-foreground tabular-nums font-mono mt-0.5">
                有效期至 {user.paidUntil.toLocaleDateString("zh-CN")} · 还剩 {daysLeft} 天
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            欢迎回来。你已解锁全部内容，享受沉浸式英语习得体验。
          </p>

          <div className="rounded-lg border bg-card/50 p-5 mb-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              你的权益
            </p>
            <ul className="space-y-2.5 text-sm">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/english"
              className="flex-1 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition active:scale-[0.97]"
            >
              开始观看
            </Link>
            <Link
              href="/vocabulary"
              className="inline-flex h-11 items-center rounded-lg border px-6 text-sm font-medium hover:bg-muted transition"
            >
              我的生词本
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          会员到期前 7 天可续费 · 续费时间在原到期日后顺延
        </p>
      </div>
    );
  }

  // 未付费 → 显示套餐 + 扫码入口
  const plans = getPlans();
  const promo = isPromoActive();
  const promoDaysLeft = Math.max(
    0,
    Math.ceil((new Date(PROMO_END).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">解锁全部内容</h1>
      <p className="text-sm text-muted-foreground mb-8">
        微信扫码支付 → 立即解锁全部剧集 + 电影 + 词典 + 进度同步
      </p>

      {promo && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="font-medium text-amber-500">首发活动 ¥168</span>
          <span className="text-muted-foreground"> · 仅剩 {promoDaysLeft} 天，到期恢复 ¥298 / 年</span>
        </div>
      )}

      <UpgradeClient plans={plans} promo={promo} />
    </div>
  );
}
