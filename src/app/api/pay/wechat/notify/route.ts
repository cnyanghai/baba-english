import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallbackSignature, decryptResource } from "@/lib/wxpay";
import { getPlan } from "@/lib/plans";

// 微信回调要求 200 + JSON 响应；失败返回非 200 + {code, message}，微信会重试
export async function POST(req: Request) {
  const timestamp = req.headers.get("wechatpay-timestamp") ?? "";
  const nonce = req.headers.get("wechatpay-nonce") ?? "";
  const signature = req.headers.get("wechatpay-signature") ?? "";
  const serial = req.headers.get("wechatpay-serial") ?? "";

  const body = await req.text();
  if (!verifyCallbackSignature({ timestamp, nonce, body, signature, serial })) {
    return NextResponse.json({ code: "FAIL", message: "签名验证失败" }, { status: 401 });
  }

  let envelope: { resource?: { ciphertext: string; associated_data: string; nonce: string }; event_type?: string };
  try {
    envelope = JSON.parse(body);
  } catch {
    return NextResponse.json({ code: "FAIL", message: "JSON 解析失败" }, { status: 400 });
  }
  if (!envelope.resource) {
    return NextResponse.json({ code: "FAIL", message: "缺少 resource" }, { status: 400 });
  }

  let resource: {
    out_trade_no?: string;
    transaction_id?: string;
    trade_state?: string;
    success_time?: string;
  };
  try {
    resource = decryptResource(envelope.resource) as typeof resource;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "解密失败";
    return NextResponse.json({ code: "FAIL", message: msg }, { status: 400 });
  }

  if (envelope.event_type !== "TRANSACTION.SUCCESS" || resource.trade_state !== "SUCCESS") {
    // 非成功事件直接 ack
    return NextResponse.json({ code: "SUCCESS", message: "ignored" });
  }

  const outTradeNo = resource.out_trade_no;
  if (!outTradeNo) {
    return NextResponse.json({ code: "FAIL", message: "缺少订单号" }, { status: 400 });
  }

  const order = await prisma.wxOrder.findUnique({ where: { id: outTradeNo } });
  if (!order) {
    return NextResponse.json({ code: "FAIL", message: "订单不存在" }, { status: 404 });
  }
  if (order.status === "paid") {
    // 幂等
    return NextResponse.json({ code: "SUCCESS", message: "already paid" });
  }

  const plan = getPlan(order.planCode);
  if (!plan) {
    return NextResponse.json({ code: "FAIL", message: "套餐不存在" }, { status: 500 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.wxOrder.update({
      where: { id: outTradeNo },
      data: {
        status: "paid",
        transactionId: resource.transaction_id,
        paidAt: resource.success_time ? new Date(resource.success_time) : new Date(),
      },
    });
    const user = await tx.user.findUnique({ where: { id: order.userId } });
    const base = user?.paidUntil && user.paidUntil > new Date() ? user.paidUntil : new Date();
    const newExpiry = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    await tx.user.update({
      where: { id: order.userId },
      data: { paidUntil: newExpiry },
    });
  });

  return NextResponse.json({ code: "SUCCESS", message: "OK" });
}
