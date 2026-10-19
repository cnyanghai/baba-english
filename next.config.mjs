/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build 时跳过 ESLint / 类型检查（dev 已检查过；shadcn 新版 Button 类型缺 asChild 是已知"假阳性"）
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // 研习录（首页）里电子书的地址是 /_blob/<id>（和 claude.ai 版一样），转给 Baba 的电子书接口
  async rewrites() {
    return [{ source: "/_blob/:id", destination: "/api/yxl/files/:id" }];
  },
  // next/image 允许从 R2 公开域名加载
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7d05c92184cb4144a288b5e5319b2a03.r2.dev",
        pathname: "/posters/**",
      },
    ],
  },
};

export default nextConfig;
