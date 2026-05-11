// 公开宣传页 — /promo
// 设计为「网页版宣传片」：60 秒自动播放 6 个场景，可暂停 / 重播 / 静音
// 用法：分享链接给用户、或用 OBS 录屏导出 mp4

import { PromoPlayer } from "./promo-player";

export const metadata = {
  title: "Baba 英语 · 看视频学英语",
  description: "看剧的快感 + 学英语的硬功夫 — 一年 ¥168",
};

export default function PromoPage() {
  return <PromoPlayer />;
}
