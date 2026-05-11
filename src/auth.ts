import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    // 手机号 + 密码 (注册和找回密码用验证码 — 不在 provider 里)
    Credentials({
      id: "phone",
      name: "手机号",
      credentials: {
        phone: { label: "手机号", type: "tel" },
        password: { label: "密码", type: "password" },
      },
      async authorize(creds) {
        const phone = typeof creds?.phone === "string" ? creds.phone.trim() : "";
        const password = typeof creds?.password === "string" ? creds.password : "";
        if (!/^1[3-9]\d{9}$/.test(phone) || !password) return null;
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || !user.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name ?? null, email: user.email ?? null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
