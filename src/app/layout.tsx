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
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <Header />
          <main className="pt-14">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
