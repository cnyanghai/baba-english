import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsCode, generateSmsCode } from "@/lib/sms";

const RESEND_GAP_SEC = 60;
const VALID_MIN = 10;

function validatePhone(p: string) {
  return /^1[3-9]\d{9}$/.test(p);
}

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  if (!validatePhone(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  // 限频：60 秒内同一手机号只发一次
  const recent = await prisma.smsCode.findFirst({
    where: { phone, createdAt: { gte: new Date(Date.now() - RESEND_GAP_SEC * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return NextResponse.json({ error: `请 ${RESEND_GAP_SEC} 秒后再试` }, { status: 429 });
  }

  const code = generateSmsCode();
  const sent = await sendSmsCode(phone, code);
  if (!sent.ok) {
    return NextResponse.json({ error: `短信发送失败: ${sent.error}` }, { status: 502 });
  }

  await prisma.smsCode.create({
    data: {
      phone,
      code,
      expireAt: new Date(Date.now() + VALID_MIN * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, validMin: VALID_MIN });
}
