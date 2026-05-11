// 套餐表 — 当前仅一档：年卡。¥298 是原价，¥168 是首发活动价（2026-05-17 23:59 UTC+8 截止）

export type PlanCode = "yearly";

export type Plan = {
  code: PlanCode;
  label: string;
  amountFen: number;        // 实际收款（活动期内 = 活动价）
  originalFen: number;      // 划线原价
  durationDays: number;
  description: string;
  promoEndsAt: string;      // ISO 时间，活动截止
};

const PROMO_END = "2026-05-17T23:59:59+08:00";

export function isPromoActive(): boolean {
  return Date.now() < new Date(PROMO_END).getTime();
}

export function getYearly(): Plan {
  const promo = isPromoActive();
  return {
    code: "yearly",
    label: "年卡",
    amountFen: promo ? 16800 : 29800,
    originalFen: 29800,
    durationDays: 365,
    description: "Baba 英语 · 年卡 · 全部内容",
    promoEndsAt: PROMO_END,
  };
}

// 每次调用都重新算（保证活动到期后自动恢复原价）
export function getPlans(): Plan[] {
  return [getYearly()];
}

export function getPlan(code: string): Plan | null {
  if (code === "yearly") return getYearly();
  return null;
}

export { PROMO_END };
