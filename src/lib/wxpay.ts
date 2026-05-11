// 微信支付 V3 NATIVE（公钥支付模式）— 商户号/证书等参数见 WXPAY_* 环境变量
// 请求签名：商户私钥 (apiclient_key.pem) RSA-SHA256
// 回调验签：微信平台公钥 (pub_key.pem) — 公钥模式，不需要动态拉证书

import crypto from "node:crypto";
import fs from "node:fs";

const MCH_ID = process.env.WXPAY_MCH_ID ?? "";
const APP_ID = process.env.WXPAY_APP_ID ?? "";
const CERT_SERIAL = process.env.WXPAY_CERT_SERIAL ?? ""; // 商户证书序列号
const PUB_KEY_ID = process.env.WXPAY_PUBLIC_KEY_ID ?? ""; // 微信平台公钥 ID
const API_V3_KEY = process.env.WXPAY_API_V3_KEY ?? "";
const NOTIFY_URL = process.env.WXPAY_NOTIFY_URL ?? "";
const PRIVATE_KEY_PATH = process.env.WXPAY_PRIVATE_KEY_PATH ?? "/opt/baba-secrets/apiclient_key.pem";
const PUBLIC_KEY_PATH = process.env.WXPAY_PUBLIC_KEY_PATH ?? "/opt/baba-secrets/pub_key.pem";

let cachedPriv: crypto.KeyObject | null = null;
let cachedPub: crypto.KeyObject | null = null;

function getPrivateKey(): crypto.KeyObject {
  if (!cachedPriv) {
    cachedPriv = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, "utf8"));
  }
  return cachedPriv;
}

function getPublicKey(): crypto.KeyObject {
  if (!cachedPub) {
    cachedPub = crypto.createPublicKey(fs.readFileSync(PUBLIC_KEY_PATH, "utf8"));
  }
  return cachedPub;
}

function buildAuthHeader(method: string, urlPath: string, body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const signStr = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signStr), getPrivateKey()).toString("base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${MCH_ID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${CERT_SERIAL}"`;
}

export type NativeOrderInput = {
  outTradeNo: string;
  amountFen: number;
  description: string;
};

export async function createNativeOrder(input: NativeOrderInput): Promise<{ codeUrl: string }> {
  const urlPath = "/v3/pay/transactions/native";
  const payload = {
    appid: APP_ID,
    mchid: MCH_ID,
    description: input.description,
    out_trade_no: input.outTradeNo,
    notify_url: NOTIFY_URL,
    amount: { total: input.amountFen, currency: "CNY" },
  };
  const body = JSON.stringify(payload);
  const auth = buildAuthHeader("POST", urlPath, body);

  const res = await fetch("https://api.mch.weixin.qq.com" + urlPath, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: auth,
      "user-agent": "baba-english/1.0",
    },
    body,
  });

  const data = (await res.json()) as { code_url?: string; code?: string; message?: string };
  if (!data.code_url) {
    throw new Error(`微信支付下单失败: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return { codeUrl: data.code_url };
}

export async function queryOrder(outTradeNo: string): Promise<{ tradeState: string; transactionId?: string }> {
  const urlPath = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${MCH_ID}`;
  const auth = buildAuthHeader("GET", urlPath, "");
  const res = await fetch("https://api.mch.weixin.qq.com" + urlPath, {
    method: "GET",
    headers: { authorization: auth, accept: "application/json" },
  });
  const data = (await res.json()) as { trade_state?: string; transaction_id?: string };
  return { tradeState: data.trade_state ?? "UNKNOWN", transactionId: data.transaction_id };
}

// 验签：回调头部 Wechatpay-Signature 由 timestamp\nnonce\nbody\n 用平台公钥签名
export function verifyCallbackSignature(opts: {
  timestamp: string;
  nonce: string;
  body: string;
  signature: string;
  serial: string;
}): boolean {
  // 公钥模式下 serial 应等于 PUB_KEY_ID
  if (PUB_KEY_ID && opts.serial !== PUB_KEY_ID) return false;
  const signStr = `${opts.timestamp}\n${opts.nonce}\n${opts.body}\n`;
  return crypto.verify(
    "RSA-SHA256",
    Buffer.from(signStr),
    getPublicKey(),
    Buffer.from(opts.signature, "base64"),
  );
}

// 解密回调中的 resource — AES-256-GCM
export function decryptResource(resource: {
  ciphertext: string;
  associated_data: string;
  nonce: string;
}): unknown {
  const ciphertext = Buffer.from(resource.ciphertext, "base64");
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(API_V3_KEY, "utf8"), Buffer.from(resource.nonce, "utf8"));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(resource.associated_data, "utf8"));
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
