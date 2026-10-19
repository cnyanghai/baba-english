import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC, Source_Serif_4, Noto_Serif_SC, Cinzel } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const notoSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});
const jetMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
// 字幕专用衬线字体（"对白是文学，不是 UI 文字"）
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif-cn",
  display: "swap",
});
// 魔幻 / 史诗感装饰字体（用于电影 / 剧名 hero）
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baba 英语 · 看视频学英语",
  description: "用美剧、电影、TED 真实切片，沉浸式习得英语",
};

const EMBED_JS = `(function(){try{if(window.self===window.top)return;var p=window.parent&&window.parent.location;if(!p||p.origin!==location.origin)return;}catch(e){return;}
document.documentElement.setAttribute("data-embed","1");
document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname==="/"){e.preventDefault();window.top.location.href=u.href;}},true);
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSC.variable} ${jetMono.variable} ${sourceSerif.variable} ${notoSerifSC.variable} ${cinzel.variable}`}
    >
      <head>
        {/* 研习录里把 Baba 的页面套在浮层（iframe）里打开时：藏掉顶栏，指回研习录首页的链接在整个窗口打开 */}
        <script dangerouslySetInnerHTML={{ __html: EMBED_JS }} />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <Header />
          <main data-site-main className="pt-14">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
