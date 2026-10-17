// 少儿编程学习路线图 —— 公开、可借鉴。静态数据，不进 DB。
// 概念脊柱：直觉指令 → 程序逻辑 → 工具基本功 → 算法实战。

export type ResourceKind = "video" | "game" | "practice";

export type PathResource = {
  id: string;
  kind: ResourceKind;
  titleZh: string;
  titleEn?: string;
  /** 平台/篇幅，如 "Harvard · 9 集" */
  platform: string;
  /** 是否免费 */
  free: boolean;
  /** 语言标注，如 "英文 · 可点词查" */
  lang: string;
  /** 概念标签 */
  tags?: string[];
  /** 家长/学习者一句话导语 */
  note: string;
  /** 详情页（内部）或资源外链 */
  href?: string;
  /** href 是否为站外链接 */
  external?: boolean;
};

export type PathStage = {
  n: string;
  title: string;
  /** 目标里的概念关键词 */
  goalConcepts: string;
  /** 目标说明 */
  goalText: string;
  resources: PathResource[];
};

export const codingStages: PathStage[] = [
  {
    n: "0",
    title: "玩中认识“指令”",
    goalConcepts: "程序 = 一串按顺序被执行的命令",
    goalText: "学完这段，孩子会有的感觉：程序 = 一串按顺序被执行的命令；能自己做出一个小动画或小游戏。",
    resources: [
      {
        id: "cs50",
        kind: "video",
        titleZh: "CS50 · 用 Scratch 学编程",
        titleEn: "Harvard · 9 集",
        platform: "Harvard · 九集课件",
        free: true,
        lang: "英文 · 可点词查",
        tags: ["视频课 · 自托管"],
        note: "主课。哈佛专门给零基础做的九集 Scratch 课——不写字，用积木讲清函数、条件、循环、变量。视频自托管、页内直接看。",
        href: "/learn/coding/cs50",
      },
      {
        id: "swift-playgrounds",
        kind: "game",
        titleZh: "Swift Playgrounds",
        titleEn: "iPad / Mac",
        platform: "iPad / Mac",
        free: true,
        lang: "中英",
        note: "苹果做的引导，指挥小角色 Byte 捡宝石、拨开关，把命令/函数/循环/条件做成一关关谜题。站内配了逐章通关路线：先学哪章、怎么打、再学哪章。",
        href: "/learn/coding/swift",
      },
    ],
  },
  {
    n: "1",
    title: "用游戏吃透程序逻辑",
    goalConcepts: "顺序 · 循环 · 条件 · 变量 · 并行",
    goalText: "学完这段，孩子能理解：顺序 · 循环 · 条件 · 变量 · 并行——所有编程语言共通的骨架。",
    resources: [
      {
        id: "hrm",
        kind: "game",
        titleZh: "Human Resource Machine",
        titleEn: "HRM · 41 关",
        platform: "HRM · 41 关",
        free: false,
        lang: "中文",
        tags: ["循环 · 条件 · 变量"],
        note: "把编程扒到最裸：只有“搬运、跳转、判断”几条命令。全关攻略进站——每关目标 + 解法代码 + 讲解，卡住随时来查。",
        href: "/learn/coding/hrm",
      },
      {
        id: "7billion",
        kind: "game",
        titleZh: "7 Billion Humans",
        titleEn: "HRM 续作",
        platform: "HRM 续作 · 约 60 关",
        free: false,
        lang: "中文",
        tags: ["条件 · 并行"],
        note: "HRM 打通后再玩。这次同时指挥一群人——第一次遇到“很多事同时发生”（并行）。攻略后续进站。",
        href: "https://tomorrowcorporation.com/7billionhumans",
        external: true,
      },
    ],
  },
  {
    n: "2",
    title: "程序员基本功",
    goalConcepts: "命令行 · Git 版本管理",
    goalText: "学完这段，孩子会用：命令行 · Git 版本管理——真程序员每天都在用的两样工具。",
    resources: [
      {
        id: "terminal",
        kind: "practice",
        titleZh: "命令行闯关",
        titleEn: "terminallyonline.sh",
        platform: "网页 · 交互",
        free: true,
        lang: "英文",
        note: "在浏览器里就能敲的终端游戏，把 cd / ls / cat 这些命令玩成关卡。祛魅“黑框框”。",
        href: "https://terminallyonline.sh/",
        external: true,
      },
      {
        id: "git",
        kind: "practice",
        titleZh: "Git 分支可视化练习",
        titleEn: "learngitbranching.js.org",
        platform: "网页 · 交互",
        free: true,
        lang: "中文",
        note: "一边敲 git 命令、一边看分支像树一样长出来。把“版本管理”这件抽象事变得看得见。",
        href: "https://learngitbranching.js.org/?locale=zh_CN",
        external: true,
      },
    ],
  },
  {
    n: "3",
    title: "算法与刷题",
    goalConcepts: "看懂算法 · 独立写题解",
    goalText: "学完这段，孩子能：看懂经典算法怎么跑 · 独立写题解——从“玩逻辑”迈向“解真问题”。",
    resources: [
      {
        id: "visualgo",
        kind: "practice",
        titleZh: "VisuAlgo",
        titleEn: "visualgo.net",
        platform: "算法可视化",
        free: true,
        lang: "中英",
        note: "排序、查找、树……每个算法都做成动画，一步步看它怎么动。先“看懂”，再去写。",
        href: "https://visualgo.net/zh",
        external: true,
      },
      {
        id: "luogu",
        kind: "practice",
        titleZh: "洛谷",
        titleEn: "luogu.com.cn",
        platform: "在线题库 OJ",
        free: true,
        lang: "中文",
        note: "中文题库，从入门题起步。这时候正式引入一门语言（推荐 Python），边刷边写。",
        href: "https://www.luogu.com.cn/",
        external: true,
      },
    ],
  },
];
