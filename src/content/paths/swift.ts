// Swift Playgrounds 通关路线（模块级攻略）。静态数据，不进 DB。
// 命令/语法为 Swift Playgrounds 真实内置内容；不逐关给解法（闯关多且随版本变，按章给思路更耐用）。
// LTC1/LTC2 章节结构经官方文档 + 关卡列表核准；LTC3 为旧进阶模块（新版已并入「做 App」），按概念呈现。

export type SwiftModule = {
  n: string;
  zh: string;
  en: string;
  concept: string;
  learn: string;
  commands: string;
  strategy: string;
  tip: string;
};

export type SwiftBook = {
  id: string;
  titleZh: string;
  seriesEn: string;
  blurb: string;
  modules: SwiftModule[];
};

export const swiftIntro = {
  blurb:
    "在 iPad / Mac 上，指挥小角色 Byte 在 3D 世界里捡宝石、拨开关。它把编程最核心的概念，做成一关关看得见、摸得着的谜题。下面按内置章节的推荐顺序，给每一章的学习目标、要用的真实 Swift 命令、通关思路和小技巧——一册一册往下打。",
  appHref: "https://www.apple.com/swift/playgrounds/",
};

const ltc1: SwiftModule[] = [
  {
    n: "1",
    zh: "命令",
    en: "Commands",
    concept: "顺序 · 精确指令",
    learn: "电脑只会做你明确说出的每一步。第一章就是学会把“走到宝石那儿捡起来”拆成一条条精确命令。",
    commands: "moveForward()\ncollectGem()\nturnLeft()\ntoggleSwitch()",
    strategy:
      "看清 Byte 到宝石/开关的路径，一步步写出命令。转向只有 turnLeft()——想右转就连转三次左。命令从上到下依次执行。",
    tip: "转弯之后“前方”的方向也跟着变了，容易数错；先在脑子里替 Byte 走一遍。",
  },
  {
    n: "2",
    zh: "函数",
    en: "Functions",
    concept: "函数 · 复用",
    learn: "把一串常用命令打包成一个“新命令”（函数），起个名字，之后反复调用。代码更短、更好读。",
    commands:
      "func turnRight() {\n    turnLeft()\n    turnLeft()\n    turnLeft()\n}\n\n// 之后就能直接用：\nturnRight()",
    strategy:
      "找出重复出现的动作（比如“右转”“捡一颗再前进”），抽成函数。主流程只剩几行、一眼看懂在干嘛。",
    tip: "先在上面 func 定义、再在下面调用。给函数起个说人话的名字，代码就像一份说明书。",
  },
  {
    n: "3",
    zh: "for 循环",
    en: "For Loops",
    concept: "循环 · 固定次数",
    learn: "重复固定次数，不用复制粘贴一堆一样的命令。",
    commands: "for i in 1...4 {\n    moveForward()\n    collectGem()\n}",
    strategy:
      "看地形的重复节奏——“走一步、捡一颗”重复 4 次，就用 for 循环写一次、跑 4 遍。台阶、方阵这类规律地图最适合。",
    tip: "1...4 表示重复 4 次；把“每一轮要做的事”放进大括号里。",
  },
  {
    n: "4",
    zh: "条件",
    en: "Conditional Code",
    concept: "条件 · if / else",
    learn: "让 Byte 看情况做决定：脚下有宝石就捡、前面挡住就转。用 if / else 应对不确定的地图。",
    commands:
      "if isOnGem {\n    collectGem()\n}\n\nif isBlocked {\n    turnLeft()\n} else {\n    moveForward()\n}",
    strategy:
      "地图不确定时别写死步骤，改成“如果…就…”。isOnGem、isBlocked、isOnClosedSwitch 这些是 Byte 的“传感器”，返回真/假。",
    tip: "if 只在条件为真时执行；配合循环，就能用一套代码走完各种不同的地图。",
  },
  {
    n: "5",
    zh: "逻辑运算",
    en: "Logical Operators",
    concept: "非 · 且 · 或",
    learn: "一个条件不够用时，把多个条件组合起来判断：! 取反、&& 且、|| 或。",
    commands:
      "if !isBlocked {\n    moveForward()          // 前面没挡住才走\n}\n\nif isBlockedLeft && isBlockedRight {\n    turnLeft()             // 左右都堵住才掉头\n    turnLeft()\n}",
    strategy:
      "用组合条件表达更复杂的判断：!isBlocked（前方通畅）、两边都堵才转身。这样一套规则能覆盖更多岔路情况。",
    tip: "! 取反最常用；&& 要两个都为真、|| 只要有一个为真。多用括号让判断更清楚。",
  },
  {
    n: "6",
    zh: "while 循环",
    en: "While Loops",
    concept: "循环 · 条件重复",
    learn: "重复到某个条件成立为止——当你不知道要重复几次时用它。",
    commands: "while !isOnGem {\n    moveForward()\n}\ncollectGem()   // 一直走到踩上宝石才停",
    strategy:
      "不知道要走几步时用 while：“一直走，直到踩到宝石”。while 管“重复多久”，循环体里的 if 管“这一步具体做什么”。",
    tip: "循环条件迟早要变成假，否则 Byte 会原地卡死（死循环）；确保每轮都在向目标靠近。",
  },
  {
    n: "7",
    zh: "算法",
    en: "Algorithms",
    concept: "综合 · 通用规则",
    learn: "把前面全部组合起来，设计一套“无论地图长什么样都能通关”的通用规则——这就是算法思维。",
    commands:
      "while !isOnGem {\n    if !isBlockedRight {\n        turnRight()\n        moveForward()\n    } else if !isBlocked {\n        moveForward()\n    } else {\n        turnLeft()\n    }\n}   // “右手贴墙”走迷宫",
    strategy:
      "面对随机迷宫，别去记死某条路线，而是写一套对所有情况都成立的规则（比如右手定则：一直贴着右墙走，总能走出去）。先想清楚规则，再翻译成 if / while。",
    tip: "判断“这个规则是不是对每种地形都成立”——这正是从“会写命令”到“会设计算法”的关键一跳。",
  },
];

const ltc2: SwiftModule[] = [
  {
    n: "1",
    zh: "变量",
    en: "Variables",
    concept: "变量 · 记住状态",
    learn: "用变量记住数量、开关状态——让程序能“边走边数”“记事”。从“只会走”升级到“会记”。",
    commands: "var gemCounter = 0\n\ngemCounter += 1      // 每捡一颗就 +1\nif gemCounter == 7 {\n    // 够 7 颗了，做点什么\n}",
    strategy:
      "需要“数一数”时（捡了几颗宝石、开了几个开关）就设一个变量，每次 += 1，再拿它做判断。对应关卡：Keeping Track、Bump Up The Value。",
    tip: "var 是可变的（能改），let 是常量（不能改）；变量要先给一个初始值。",
  },
  {
    n: "2",
    zh: "类型",
    en: "Types",
    concept: "类型 · 布尔 · 传送门",
    learn: "认识不同“类型”的值：数字、真假（Bool）。用它表达“门是开还是关”这类状态。",
    commands: "var portalIsActive = true    // Bool：真/假\n\nif portalIsActive {\n    // 门开着，走过去\n}",
    strategy:
      "传送门、开关这些“开/关”状态用 Bool（true / false）表示，存进变量再判断。对应关卡：Portal On and Off、Setting the Right Portal。",
    tip: "每个值都有类型；类型对不上（拿数字当真假用）程序会报错。",
  },
  {
    n: "3",
    zh: "初始化",
    en: "Initialization",
    concept: "初始化 · 创建实例",
    learn: "学会“创建”自己的角色（Expert）实例，给它起名字、放进世界——世界里能同时有好几个角色各干各的。",
    commands: "let expert = Expert()\n\nexpert.turnLockUp()\nexpert.moveForward()",
    strategy:
      "用 `类型名()` 造出一个实例、存进常量，之后就能命令它做事。对应关卡：Initializing Your Expert、Train Your Expert。",
    tip: "初始化 = 从“类型模板”造出一个具体的“实例”。一个 Expert 类型，可以造出好几个 expert。",
  },
  {
    n: "4",
    zh: "参数",
    en: "Parameters",
    concept: "参数 · 通用函数",
    learn: "给函数开“输入口”（参数），让同一个函数能干不同的活——走 3 步还是 5 步、去哪个坐标。",
    commands:
      "func move(distance: Int) {\n    for i in 1...distance {\n        moveForward()\n    }\n}\n\nmove(distance: 4)",
    strategy:
      "发现两个函数几乎一样、只差一个数时，把那个数变成参数、合并成一个通用函数。对应关卡：Generalizing a Function、It Takes Two。",
    tip: "参数在括号里写“名字: 类型”，调用时传具体值。这是“抽象”的进阶（呼应 CS50 第 8 集）。",
  },
  {
    n: "5",
    zh: "建造世界",
    en: "World Building",
    concept: "建造世界 · 坐标",
    learn: "不只是解别人的关——自己用代码摆放积木、水、传送门，用坐标造出一张地图。从玩家变设计者。",
    commands:
      "world.place(Block(), atColumn: 3, row: 2)\nworld.place(expert, facing: .north,\n            atColumn: 0, row: 0)",
    strategy:
      "用 place(...) 一块块搭地形，用坐标 (column, row) 定位。先想好地图长啥样，再用循环批量摆。对应关卡：Uniting Worlds、Floating Islands。",
    tip: "从“玩关卡”到“造关卡”是质变——你开始站在设计者的角度想问题。",
  },
  {
    n: "6",
    zh: "数组",
    en: "Arrays",
    concept: "数组 · 一串数据",
    learn: "用数组一次装很多个值（一串高度、一串坐标），再用循环挨个处理。",
    commands:
      "let heights = [2, 5, 1, 4]\n\nfor h in heights {\n    // 用每个 h 摆一列 h 格高的积木\n}",
    strategy:
      "要处理“一整批”东西（每列高度、每个宝石位置）时用数组：列成一串，用 for 循环逐个取出处理。对应关卡：Arrays Introduction、Stacking Blocks。",
    tip: "数组从 0 开始编号；array[5] 超出范围会崩（Index Out Of Range）——循环边界要小心。",
  },
];

export const swiftBooks: SwiftBook[] = [
  {
    id: "ltc1",
    titleZh: "第一册 · 打基础",
    seriesEn: "Learn to Code 1",
    blurb: "指挥 Byte 捡宝石，把顺序、函数、循环、条件、算法一关关走通。零基础从这里开始。",
    modules: ltc1,
  },
  {
    id: "ltc2",
    titleZh: "第二册 · 会记事、会造世界",
    seriesEn: "Learn to Code 2",
    blurb: "打通第一册后接着玩。学会用变量记状态、创建自己的角色、写带参数的通用函数，甚至用代码造地图。",
    modules: ltc2,
  },
];

/** Learn to Code 3 / 进阶：旧版进阶模块，新版已并入「做真正的 App」 */
export const swiftAdvanced = {
  titleZh: "第三册 · 走向真实 App",
  seriesEn: "Learn to Code 3 / 做 App",
  note:
    "「Learn to Code 3」是 Apple 早年的进阶模块，把前两册学的东西用到“更像真 App”的场景。新版 Swift Playgrounds 已把这部分并入「做真正的 App」——用 SwiftUI 搭界面、响应点击，最后做出一个能装进手机、甚至上架 App Store 的作品。方向大致是：",
  points: [
    "图形与坐标——在屏幕上画东西、精确定位",
    "触摸与事件——响应点击、拖动，做出能互动的界面",
    "把前两册的变量 / 数组 / 函数，用到真实交互里",
    "用 SwiftUI 从零做一个自己的 App（这也是 Apple 官方“做 App”教程的起点）",
  ],
};
