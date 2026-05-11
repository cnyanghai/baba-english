import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: { phone?: string; code?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  const code = (body.code ?? "").trim();
  const password = body.password ?? "";

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "验证码必须是 6 位数字" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "新密码至少 6 位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: "该手机号未注册" }, { status: 404 });
  }

  const sms = await prisma.smsCode.findFirst({
    where: { phone, code, used: false, expireAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!sms) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
  }
  await prisma.smsCode.update({ where: { id: sms.id }, data: { used: true } });

  const passwordHash = await hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
