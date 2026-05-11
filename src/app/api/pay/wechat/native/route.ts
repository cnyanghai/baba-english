import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNativeOrder } from "@/lib/wxpay";
import { getPlan } from "@/lib/plans";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const plan = getPlan(body.plan ?? "");
  if (!plan) return NextResponse.json({ error: "无效套餐" }, { status: 400 });

  // 先在 DB 建订单（拿到 cuid 作为 out_trade_no）
  const order = await prisma.wxOrder.create({
    data: {
      userId,
      amountFen: plan.amountFen,
      planCode: plan.code,
      description: plan.description,
      status: "pending",
    },
  });

  try {
    const { codeUrl } = await createNativeOrder({
      outTradeNo: order.id,
      amountFen: plan.amountFen,
      description: plan.description,
    });
    await prisma.wxOrder.update({
      where: { id: order.id },
      data: { codeUrl },
    });
    return NextResponse.json({ orderId: order.id, codeUrl, amountFen: plan.amountFen });
  } catch (e) {
    await prisma.wxOrder.update({
      where: { id: order.id },
      data: { status: "failed" },
    });
    const msg = e instanceof Error ? e.message : "下单失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
