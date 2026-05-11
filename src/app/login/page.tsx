"use client";

import { useState, FormEvent, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register" | "forgot";

const MODE_LABEL: Record<Mode, string> = {
  login: "登录",
  register: "注册",
  forgot: "找回密码",
};

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? params.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown(sec: number) {
    setCooldown(sec);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
    setCode("");
    setPassword("");
  }

  async function handleSendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("手机号格式不正确");
      return;
    }
    setError(null);
    setInfo(null);
    setSending(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; validMin?: number };
      if (!res.ok) setError(data.error ?? "发送失败");
      else {
        setInfo(`验证码已发送，${data.validMin ?? 10} 分钟内有效`);
        startCooldown(60);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络异常");
    }
    setSending(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const r = await signIn("phone", { phone, password, redirect: false });
        if (r?.error) {
          setError("手机号或密码错误");
        } else {
          router.push(callbackUrl);
          router.refresh();
          return;
        }
      } else if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error ?? "注册失败");
        } else {
          // 注册成功 → 自动登录
          const r = await signIn("phone", { phone, password, redirect: false });
          if (r?.error) {
            setError("注册成功但自动登录失败，请手动登录");
            setMode("login");
          } else {
            router.push(callbackUrl);
            router.refresh();
            return;
          }
        }
      } else {
        // forgot
        const res = await fetch("/api/password/reset", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone, code, password }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error ?? "重置失败");
        } else {
          setInfo("密码已重置，正在登录…");
          const r = await signIn("phone", { phone, password, redirect: false });
          if (r?.error) {
            setError("登录失败，请手动登录");
            setMode("login");
          } else {
            router.push(callbackUrl);
            router.refresh();
            return;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    }
    setBusy(false);
  }

  const needsCode = mode === "forgot";

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      {/* 顶部 tab */}
      <div className="mb-6 flex border-b">
        {(["login", "register", "forgot"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 pb-2 text-sm transition ${
              mode === m
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <h1 className="font-serif text-2xl font-medium tracking-tight mb-1">
        {MODE_LABEL[mode]}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {mode === "login"
          ? "用注册时设置的手机号 + 密码登录"
          : mode === "register"
            ? "手机号 + 密码即可注册"
            : "通过短信验证码重置密码"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">手机号（即用户名）</label>
          <Input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="1xxxxxxxxxx"
            autoComplete="tel"
            required
          />
        </div>

        {needsCode && (
          <div>
            <label className="text-xs text-muted-foreground">验证码</label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 位"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={sending || cooldown > 0 || phone.length !== 11}
                className="shrink-0 whitespace-nowrap"
              >
                {cooldown > 0 ? `${cooldown}s` : sending ? "发送中…" : "发送验证码"}
              </Button>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">
            {mode === "forgot" ? "新密码" : "密码"}（至少 6 位）
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {info && <p className="text-xs text-emerald-500">{info}</p>}

        <Button
          type="submit"
          disabled={busy || phone.length !== 11 || password.length < 6 || (needsCode && code.length !== 6)}
          className="w-full"
        >
          {busy ? "处理中…" : MODE_LABEL[mode]}
        </Button>

        {mode === "login" && (
          <div className="flex justify-between pt-2 text-xs text-muted-foreground">
            <button type="button" onClick={() => switchMode("register")} className="hover:text-foreground underline">
              没有账号？去注册
            </button>
            <button type="button" onClick={() => switchMode("forgot")} className="hover:text-foreground underline">
              忘记密码
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
