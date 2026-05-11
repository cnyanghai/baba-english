// 阿里云短信服务 V3（RPC, HMAC-SHA1）— 手写无 SDK，避免引入巨型依赖
// 复用 nongV1 的 AccessKey + Template + 申请新签名 / 暂用通用签名

import crypto from "node:crypto";

const ENDPOINT = "https://dysmsapi.aliyuncs.com/";

const AK = process.env.ALIYUN_SMS_AK_ID ?? "";
const SK = process.env.ALIYUN_SMS_AK_SECRET ?? "";
const SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME ?? "";
const TEMPLATE_CODE = process.env.ALIYUN_SMS_TEMPLATE_CODE ?? "";

function percentEncode(s: string) {
  return encodeURIComponent(s)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

export async function sendSmsCode(phone: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!AK || !SK || !SIGN_NAME || !TEMPLATE_CODE) {
    return { ok: false, error: "SMS 未配置（缺少 AK / 签名 / 模板）" };
  }

  const params: Record<string, string> = {
    Format: "JSON",
    Version: "2017-05-25",
    AccessKeyId: AK,
    SignatureMethod: "HMAC-SHA1",
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    SignatureVersion: "1.0",
    SignatureNonce: crypto.randomUUID(),
    Action: "SendSms",
    PhoneNumbers: phone,
    SignName: SIGN_NAME,
    TemplateCode: TEMPLATE_CODE,
    TemplateParam: JSON.stringify({ code }),
  };

  const sortedKeys = Object.keys(params).sort();
  const canonical = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join("&");
  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonical)}`;
  const signature = crypto.createHmac("sha1", SK + "&").update(stringToSign).digest("base64");

  const body = new URLSearchParams({ ...params, Signature: signature }).toString();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { Code?: string; Message?: string };
  if (data.Code === "OK") return { ok: true };
  return { ok: false, error: `${data.Code}: ${data.Message ?? "unknown"}` };
}

export function generateSmsCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
