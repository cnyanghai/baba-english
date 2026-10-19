import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookMarked, BookOpen, User, LogIn, BarChart3, Sparkles, Crown, Code2 } from "lucide-react";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const userId = (user as { id?: string } | undefined)?.id;

  // 拉付费状态（最便宜的查询，只取一字段）
  let paidUntil: Date | null = null;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { paidUntil: true },
    });
    paidUntil = u?.paidUntil ?? null;
  }
  const isPaid = paidUntil && paidUntil > new Date();

  const displayName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : null);

  return (
    <header data-site-header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link href="/english" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight hover:opacity-80 transition">
          <span
            aria-hidden
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/40"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-black/85 fill-current">
              <path d="M8 5.5v13L19 12 8 5.5Z" />
            </svg>
          </span>
          <span className="font-bold">
            <span className="text-foreground">Baba</span>
            <span className="text-muted-foreground/80 ml-1 font-normal">英语</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {/* 研习录：网站首页（静态页面，用普通 a 标签整页跳过去） */}
          <Button asChild variant="ghost" size="sm" title="研习录">
            <a href="/">
              {/* 研习录的站标：红圈加一道横杠（像地铁站牌） */}
              <svg viewBox="0 0 24 24" aria-hidden className="mr-1 h-4 w-4">
                <circle cx="12" cy="12" r="8" fill="none" stroke="#C8372D" strokeWidth="3.2" />
                <rect x="1.5" y="9.6" width="21" height="4.8" rx="0.6" className="fill-current" />
              </svg>
              <span className="hidden sm:inline">研习录</span>
            </a>
          </Button>
          <ThemeToggle />

          {/* 升级 / 会员入口 */}
          {user && !isPaid && (
            <Button
              asChild
              size="sm"
              className="h-8 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 px-3"
            >
              <Link href="/upgrade">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">升级 ¥168</span>
                <span className="sm:hidden">升级</span>
              </Link>
            </Button>
          )}
          {user && isPaid && paidUntil && (
            <Button asChild variant="ghost" size="sm" title={`会员有效期至 ${paidUntil.toLocaleDateString("zh-CN")}`}>
              <Link href="/upgrade">
                <Crown className="mr-1 h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline text-xs text-muted-foreground">会员</span>
              </Link>
            </Button>
          )}

          {user && (
            <Button asChild variant="ghost" size="sm" title="学习进度">
              <Link href="/progress">
                <BarChart3 className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">进度</span>
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/books">
              <BookOpen className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">绘本</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/learn/coding">
              <Code2 className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">编程</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/vocabulary">
              <BookMarked className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">生词本</span>
            </Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" size="sm" title={user.email ?? ""}>
              <Link href="/account">
                <User className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline max-w-[7rem] truncate">{displayName}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">
                <LogIn className="mr-1 h-4 w-4" />
                登录
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
