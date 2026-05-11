import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { queryOrder } from "@/lib/wxpay";

// 前端轮询订单状态。如果本地仍 pending，主动到微信 query 一次（防回调延迟）
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const order = await prisma.wxOrder.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.status === "pending") {
    try {
      const r = await queryOrder(order.id);
      if (r.tradeState === "SUCCESS") {
        // 主动同步：直接更新（注意 paidUntil 在 notify 中已统一处理；此处简化复用）
        await prisma.wxOrder.update({
          where: { id: order.id },
          data: { status: "paid", transactionId: r.transactionId, paidAt: new Date() },
        });
        return NextResponse.json({ status: "paid" });
      }
    } catch {
      // query 失败不影响轮询本身
    }
  }

  return NextResponse.json({ status: order.status });
}
