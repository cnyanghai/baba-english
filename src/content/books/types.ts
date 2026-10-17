// 英语绘本内容模型 —— 纯静态数据，不进 DB。
// 一本绘本 = 若干页；每页 = 一张整幅插图 + 若干「英文句 / 平行中文」。

export type BookSentence = {
  /** 英文原句（点词查词 / 朗读的单位） */
  en: string;
  /** 平行中文（点句显示） */
  zh: string;
};

export type BookPage = {
  /** 页码，从 1 开始 */
  n: number;
  /** 插图 public 路径，如 /books/hp-opening/page-01.webp */
  image: string;
  /** 图片 alt（英文，简短） */
  alt: string;
  /** 本页文字，按句拆分 */
  sentences: BookSentence[];
};

export type PictureBook = {
  slug: string;
  titleEn: string;
  titleZh: string;
  /** 出处，如《哈利·波特与魔法石》第一章 */
  source: string;
  /** 一句话简介 */
  blurb: string;
  /** 封面图 public 路径 */
  cover: string;
  /** 难度 / 篇幅标签 */
  level: string;
  pages: BookPage[];
};
