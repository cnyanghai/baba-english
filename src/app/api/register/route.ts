import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: { phone?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  const password = body.password ?? "";

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "该手机号已注册，请直接登录" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);
  if (existing) {
    // 旧用户（之前用验证码自动注册的）补设密码
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
  } else {
    await prisma.user.create({ data: { phone, passwordHash } });
  }

  return NextResponse.json({ ok: true });
}
