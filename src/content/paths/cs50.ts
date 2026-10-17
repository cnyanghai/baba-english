// 内容源自 Harvard CS50「Introduction to Programming with Scratch」，
// 依 CC BY-NC-SA 4.0 改写为中文课件。视频自托管于 R2。此文件为静态数据，不进 DB。

export type CS50Chapter = { ts: string; title: string };
export type CS50Episode = {
  n: number;
  zh: string;
  en: string;
  dur: string;
  videoUrl: string;
  concepts: string[];
  objectives: string[];
  conceptCards: { term: string; gloss: string }[];
  blocks: { cat: string; list: string }[];
  examples: { name: string; desc: string }[];
  practice: string;
  takeaway: string;
  chapters: CS50Chapter[];
};

export const cs50Episodes: CS50Episode[] = [
  {
    "n": 1,
    "zh": "角色与舞台",
    "en": "Sprites",
    "dur": "23:43",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-01.mp4",
    "concepts": [
      "计算思维",
      "坐标系",
      "对象与属性"
    ],
    "objectives": [
      "认识 Scratch 界面：积木库 / 脚本区 / 舞台 / 角色区",
      "往舞台放角色，给它换造型、换背景",
      "让角色显示、改大小、改方向"
    ],
    "conceptCards": [
      {
        "term": "计算思维",
        "gloss": "把想做的事拆成一串电脑能照做的指令。"
      },
      {
        "term": "坐标系",
        "gloss": "舞台用 x（左右）和 y（上下）给每个位置一个门牌号。"
      },
      {
        "term": "对象与属性",
        "gloss": "每个角色是一个“对象”，有位置、大小、方向、造型这些“属性”。"
      },
      {
        "term": "造型 = 动画最小单位",
        "gloss": "切换角色的不同造型，看起来就“动”了起来。"
      }
    ],
    "blocks": [
      {
        "cat": "界面与角色",
        "list": "积木库 · 脚本区 · 舞台 · 角色区 · 选择角色 · 复制 · 删除"
      },
      {
        "cat": "角色属性",
        "list": "显示/隐藏 · 大小(%) · 方向(度) · 旋转方式(全向/左右)"
      },
      {
        "cat": "三个标签页",
        "list": "造型 Costumes · 声音 Sounds · 背景 Backdrops"
      }
    ],
    "examples": [
      {
        "name": "认识角色",
        "desc": "把猫和鱼摆到舞台不同位置，理解 x/y。"
      },
      {
        "name": "造型动画",
        "desc": "给角色加多个造型、来回切换，做出最朴素的动画。"
      },
      {
        "name": "换背景",
        "desc": "加一个水下背景，把鱼放进去，试试旋转方式。"
      }
    ],
    "practice": "放一个角色 + 一个背景，给角色加两个造型，让它切换造型看起来像在动。",
    "takeaway": "程序 = 一串你给“演员”下的命令。先摆好舞台和演员，故事才能开始。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "什么是编程"
      },
      {
        "ts": "2:13",
        "title": "角色 Sprite"
      },
      {
        "ts": "11:00",
        "title": "造型 Costume"
      },
      {
        "ts": "17:52",
        "title": "背景 Backdrop"
      }
    ]
  },
  {
    "n": 2,
    "zh": "函数",
    "en": "Functions",
    "dur": "33:43",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-02.mp4",
    "concepts": [
      "函数",
      "输入",
      "顺序执行"
    ],
    "objectives": [
      "用积木让角色移动、转向、滑行、说话",
      "理解一块积木就是一个“会做事的函数”",
      "用“等待”控制节奏，让变化看得见"
    ],
    "conceptCards": [
      {
        "term": "函数",
        "gloss": "一块能完成某件事的积木；给它不同输入，行为就不同。"
      },
      {
        "term": "输入 Inputs",
        "gloss": "填进积木里的数值/文字，改变它怎么做（走 10 步 vs 走 50 步）。"
      },
      {
        "term": "脚本",
        "gloss": "一摞积木从上往下顺序执行——这就是“程序的流程”。"
      },
      {
        "term": "注释 & 节奏",
        "gloss": "注释是给人看的说明；wait 让动作慢下来、看得清。"
      }
    ],
    "blocks": [
      {
        "cat": "运动",
        "list": "移动 N 步 · 右转 N 度 · 移到 x,y · 滑行 N 秒到 x,y"
      },
      {
        "cat": "外观",
        "list": "说 N 秒 · 换造型 · 换背景 · 显示 · 隐藏"
      },
      {
        "cat": "声音 / 控制",
        "list": "播放声音直到结束 · 等待 N 秒"
      },
      {
        "cat": "扩展积木",
        "list": "音乐：演奏音符/设乐器/设速度　画笔：落笔/抬笔"
      }
    ],
    "examples": [
      {
        "name": "Move / Move & Turn",
        "desc": "单块移动，再组合移动+转向走出折线。"
      },
      {
        "name": "Glide",
        "desc": "刺猬沿矩形滑行一圈回到起点。"
      },
      {
        "name": "Say",
        "desc": "带时序的对话，一句接一句显示。"
      },
      {
        "name": "Bear",
        "desc": "造型+背景+移动，讲一小段叙事。"
      },
      {
        "name": "Duck",
        "desc": "用显示/隐藏 + 声音玩捉迷藏。"
      },
      {
        "name": "Music / Pen",
        "desc": "演奏一段音阶；移动配合抬落笔画出圆。"
      }
    ],
    "practice": "让角色说三句话、每句停 2 秒，讲一个小笑话。",
    "takeaway": "每块积木都是一个“函数”——你不用管它内部怎么实现，给输入、它替你做事。这就是真实编程里的“调用函数”。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "1:13",
        "title": "移动"
      },
      {
        "ts": "4:21",
        "title": "移动+转向"
      },
      {
        "ts": "10:28",
        "title": "滑行"
      },
      {
        "ts": "13:53",
        "title": "说话"
      },
      {
        "ts": "16:38",
        "title": "小熊 1/2"
      },
      {
        "ts": "25:39",
        "title": "鸭子"
      },
      {
        "ts": "26:38",
        "title": "音乐"
      },
      {
        "ts": "29:42",
        "title": "画笔"
      }
    ]
  },
  {
    "n": 3,
    "zh": "事件",
    "en": "Events",
    "dur": "29:47",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-03.mp4",
    "concepts": [
      "事件",
      "事件驱动",
      "用户输入"
    ],
    "objectives": [
      "用“当…就…”让程序响应点击、按键、声音",
      "让多个角色各自独立地对事件做反应",
      "用计时器协调不同角色的动作"
    ],
    "conceptCards": [
      {
        "term": "事件 Event",
        "gloss": "程序里“发生的一件事”：绿旗被点、按了键、声音变响……代码可以去响应它。"
      },
      {
        "term": "事件驱动",
        "gloss": "程序不再只从头跑到尾，而是“等事情发生，再做反应”。"
      },
      {
        "term": "用户输入",
        "gloss": "键盘、鼠标点击、麦克风响度，都能当作触发器。"
      },
      {
        "term": "多角色协调",
        "gloss": "每个角色可以有自己的事件脚本，同时各干各的。"
      }
    ],
    "blocks": [
      {
        "cat": "事件",
        "list": "当绿旗被点击 · 当此角色被点击 · 当按下[键] · 当响度>[值] · 当计时器>[值] · 当背景切换到"
      },
      {
        "cat": "运动/外观",
        "list": "指向 · 改x/改y · 移到随机位置 · 说 N 秒 · 换背景 · 设/改大小"
      },
      {
        "cat": "声音 / 旋转",
        "list": "播放声音直到结束 · 设旋转方式"
      }
    ],
    "examples": [
      {
        "name": "绿旗齐响应",
        "desc": "多个角色同时对绿旗做反应，学会协调多脚本。"
      },
      {
        "name": "点角色触发",
        "desc": "点鸭子它就随机传送。"
      },
      {
        "name": "背景选择器",
        "desc": "三个按钮角色切换北极/丛林/水下三个场景。"
      },
      {
        "name": "架子鼓",
        "desc": "点不同鼓发不同声音。"
      },
      {
        "name": "游动的鱼",
        "desc": "方向键移动、数字键改大小，多个独立事件脚本。"
      },
      {
        "name": "气球 / 计时器",
        "desc": "麦克风响就变大；猫和恐龙定时互相打招呼。"
      }
    ],
    "practice": "做一个“按钮”：点它，就切换到另一个背景。",
    "takeaway": "“当…就…”是交互的起点。真实软件全靠事件驱动——等世界发生事，再决定做什么。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "0:42",
        "title": "当绿旗被点击"
      },
      {
        "ts": "6:13",
        "title": "点角色触发"
      },
      {
        "ts": "8:10",
        "title": "背景选择器"
      },
      {
        "ts": "13:12",
        "title": "架子鼓"
      },
      {
        "ts": "16:03",
        "title": "按键触发"
      },
      {
        "ts": "17:10",
        "title": "游动的鱼"
      },
      {
        "ts": "23:18",
        "title": "气球"
      },
      {
        "ts": "25:24",
        "title": "计时器"
      }
    ]
  },
  {
    "n": 4,
    "zh": "值",
    "en": "Values",
    "dur": "30:30",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-04.mp4",
    "concepts": [
      "值",
      "运算符",
      "返回值",
      "随机"
    ],
    "objectives": [
      "认识“值”：数字和文字，是函数的输入",
      "用运算符做加减、拼接、四舍五入、取随机",
      "用“询问/回答”接住用户输入并使用它"
    ],
    "conceptCards": [
      {
        "term": "值 Value",
        "gloss": "填进积木的椭圆块，可以是数字或文字。"
      },
      {
        "term": "运算符 Operators",
        "gloss": "拿一些值算出一个新值：+、÷、拼接、四舍五入、取随机数。"
      },
      {
        "term": "返回值",
        "gloss": "有的积木会“吐出”一个值，比如“回答 answer”就是“询问”的结果。"
      },
      {
        "term": "感知与随机",
        "gloss": "能读到 x/y坐标、方向、计时器；能生成不可预测的随机值。"
      }
    ],
    "blocks": [
      {
        "cat": "运算",
        "list": "加(+) · 除(/) · 拼接 join · 四舍五入 round · 取随机数 pick random"
      },
      {
        "cat": "侦测",
        "list": "x坐标 · y坐标 · 方向 · 计时器 · 询问并等待 ask · 回答 answer"
      },
      {
        "cat": "运动/外观",
        "list": "移动 · 指向 · 说 · 大小"
      }
    ],
    "examples": [
      {
        "name": "Position",
        "desc": "用 join 拼出“x=.. , y=..”显示坐标。"
      },
      {
        "name": "走路/旋转/计时的刺猬",
        "desc": "移动距离随大小变；随机指向；round(计时器)显示秒。"
      },
      {
        "name": "Hello",
        "desc": "问用户名字，再打招呼。"
      },
      {
        "name": "四个小问答",
        "desc": "用回答决定：走几步 / 去哪(x,y) / 几条腿(造型) / 几点(背景)。"
      }
    ],
    "practice": "问用户“你几岁？”，然后说“你明年就 X 岁啦”（用加法运算符）。",
    "takeaway": "程序里流动的是“值”。会问、会算、会记，程序才聪明——这就是所有语言里的数字、字符串、布尔。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "0:40",
        "title": "坐标位置"
      },
      {
        "ts": "12:26",
        "title": "走路刺猬"
      },
      {
        "ts": "16:02",
        "title": "旋转刺猬"
      },
      {
        "ts": "18:04",
        "title": "计时刺猬"
      },
      {
        "ts": "20:29",
        "title": "你好"
      },
      {
        "ts": "23:54",
        "title": "走几步"
      },
      {
        "ts": "24:51",
        "title": "去哪"
      },
      {
        "ts": "26:04",
        "title": "几条腿"
      },
      {
        "ts": "28:23",
        "title": "几点了"
      }
    ]
  },
  {
    "n": 5,
    "zh": "条件",
    "en": "Conditions",
    "dur": "28:09",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-05.mp4",
    "concepts": [
      "布尔",
      "if / else",
      "比较",
      "嵌套"
    ],
    "objectives": [
      "用“如果…那么…”让程序会看情况做决定",
      "用碰撞/比较写出真/假的判断条件",
      "把条件嵌套起来，处理多种情况"
    ],
    "conceptCards": [
      {
        "term": "布尔 Boolean",
        "gloss": "答案只有“真/假、是/否”的问题。"
      },
      {
        "term": "条件逻辑",
        "gloss": "“如果<条件>那么<做…>”，条件成立才执行。"
      },
      {
        "term": "比较运算",
        "gloss": "= 相等、> 大于、< 小于，把两个值比一比。"
      },
      {
        "term": "嵌套条件",
        "gloss": "在“否则”里再放一个“如果”，分出正/负/零这种多情况。"
      }
    ],
    "blocks": [
      {
        "cat": "控制",
        "list": "如果<>那么 · 如果<>那么否则"
      },
      {
        "cat": "侦测(布尔)",
        "list": "碰到鼠标? · 碰到角色? · 碰到颜色? · 碰到边缘?"
      },
      {
        "cat": "运算",
        "list": "= · > · < · round · 计时器"
      },
      {
        "cat": "配合",
        "list": "说 N 秒 · 移到随机位置 · 改x/改y · 隐藏 · 播放声音"
      }
    ],
    "examples": [
      {
        "name": "Meow / 猫和气球 / 猫和树",
        "desc": "按空格叫；只有碰到气球才叫；碰到绿色就报告。"
      },
      {
        "name": "Balloon",
        "desc": "每按一次变大，到 200 就隐藏并爆掉。"
      },
      {
        "name": "Numbers",
        "desc": "输入一个数，用嵌套条件判断正 / 负 / 零。"
      },
      {
        "name": "刺猬赛跑 & 迷宫",
        "desc": "到边显示用时；按用时说快/慢；撞到红墙就随机传送。"
      }
    ],
    "practice": "做一个“猜大小”：问一个数，判断它比 10 大还是小，说出来。",
    "takeaway": "if / else 让程序会做决定。会判断，程序才有“智能”的雏形。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "1:30",
        "title": "喵"
      },
      {
        "ts": "4:56",
        "title": "猫和气球"
      },
      {
        "ts": "6:35",
        "title": "猫和树"
      },
      {
        "ts": "8:58",
        "title": "气球"
      },
      {
        "ts": "10:26",
        "title": "数字"
      },
      {
        "ts": "20:06",
        "title": "刺猬赛跑1"
      },
      {
        "ts": "22:46",
        "title": "刺猬赛跑2"
      },
      {
        "ts": "24:19",
        "title": "迷宫"
      }
    ]
  },
  {
    "n": 6,
    "zh": "循环",
    "en": "Loops",
    "dur": "27:31",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-06.mp4",
    "concepts": [
      "循环",
      "forever",
      "repeat until"
    ],
    "objectives": [
      "用循环重复执行，不用手动复制一堆积木",
      "分清 forever / repeat N / repeat until 三种循环",
      "用循环切造型做出走路、游泳等动画"
    ],
    "conceptCards": [
      {
        "term": "循环 Loop",
        "gloss": "写一次、重复执行很多次的机制。"
      },
      {
        "term": "无限循环 forever",
        "gloss": "一直重复，直到程序停止。"
      },
      {
        "term": "有限循环 repeat N",
        "gloss": "重复固定的次数。"
      },
      {
        "term": "条件循环 repeat until",
        "gloss": "重复到某个条件成立为止。"
      }
    ],
    "blocks": [
      {
        "cat": "控制",
        "list": "forever · repeat(N) · repeat until<> · 碰到边缘就反弹"
      },
      {
        "cat": "运动/外观",
        "list": "移动 · 右转 · 指向 · 下一个造型 · 显示/隐藏 · 设/改大小"
      },
      {
        "cat": "侦测/运算",
        "list": "到…的距离 · = 比较 · 播放声音 · 等待"
      }
    ],
    "examples": [
      {
        "name": "走路的猫",
        "desc": "forever + 碰边反弹 + 切造型 = 走路动画。"
      },
      {
        "name": "游动的鱼",
        "desc": "多个循环同时跑：跟随鼠标 + 播放海洋声。"
      },
      {
        "name": "摸猫 / Meow",
        "desc": "离鼠标近就喵；按输入次数叫（repeat N）。"
      },
      {
        "name": "Circle / 气球",
        "desc": "重复移动+转向画圆；repeat 10 次充气再爆；repeat until 到目标大小再爆。"
      }
    ],
    "practice": "用 repeat 让角色走 4 步、每步转 90 度，走出一个正方形。",
    "takeaway": "别重复自己，让机器重复。循环是编程里最省力的杠杆。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "1:13",
        "title": "走路的猫"
      },
      {
        "ts": "8:04",
        "title": "游动的鱼"
      },
      {
        "ts": "12:30",
        "title": "摸猫"
      },
      {
        "ts": "16:42",
        "title": "喵"
      },
      {
        "ts": "19:54",
        "title": "画圆"
      },
      {
        "ts": "21:20",
        "title": "气球1"
      },
      {
        "ts": "24:57",
        "title": "气球2"
      }
    ]
  },
  {
    "n": 7,
    "zh": "变量",
    "en": "Variables",
    "dur": "32:02",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-07.mp4",
    "concepts": [
      "变量",
      "全局/局部",
      "状态"
    ],
    "objectives": [
      "新建变量，把值存起来待用（分数、生命、大小）",
      "用 set / change 给变量赋值和增减",
      "用变量当条件、做计分和简单物理模拟"
    ],
    "conceptCards": [
      {
        "term": "变量 Variable",
        "gloss": "程序的“记事本”，存一个值待会儿用。"
      },
      {
        "term": "全局 vs 局部",
        "gloss": "全局变量所有角色都能用；局部变量只属于某个角色。"
      },
      {
        "term": "增减与赋值",
        "gloss": "change by 加/减；set to 直接设成某值。"
      },
      {
        "term": "用变量管状态",
        "gloss": "分数、生命、速度都用变量记——游戏才有“进度”。"
      }
    ],
    "blocks": [
      {
        "cat": "变量",
        "list": "新建变量 · 椭圆变量块 · change [变量] by · set [变量] to"
      },
      {
        "cat": "控制/侦测",
        "list": "stop all · 碰到颜色? · 等待"
      },
      {
        "cat": "运算/外观/画笔",
        "list": "乘法(反向) · 设大小 · 画笔:全部擦除/落笔"
      }
    ],
    "examples": [
      {
        "name": "计数猫",
        "desc": "点一下 +1，配一个重置按钮。"
      },
      {
        "name": "追星星",
        "desc": "碰到星星加分，到分数阈值换背景、结束。"
      },
      {
        "name": "弹跳球",
        "desc": "用变量存速度：重力加速 + 落地损耗，像真的一样弹。"
      },
      {
        "name": "Balloon / Spiral",
        "desc": "滑杆控制大小；步长逐渐变大画出螺旋。"
      }
    ],
    "practice": "做一个点击计分器：每点角色一下，分数变量 +1 并显示在舞台上。",
    "takeaway": "变量是程序的记事本。有了它，程序能记住分数、生命、进度——游戏就活了。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "1:02",
        "title": "计数猫"
      },
      {
        "ts": "7:29",
        "title": "追星星"
      },
      {
        "ts": "15:01",
        "title": "弹跳球"
      },
      {
        "ts": "24:29",
        "title": "气球"
      },
      {
        "ts": "27:38",
        "title": "螺旋"
      }
    ]
  },
  {
    "n": 8,
    "zh": "抽象",
    "en": "Abstraction",
    "dur": "24:37",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-08.mp4",
    "concepts": [
      "抽象",
      "复用",
      "参数",
      "模块化"
    ],
    "objectives": [
      "把一段复杂逻辑打包成自己的“我的积木”",
      "用参数让自定义积木变得灵活可复用",
      "理解“抽象”让代码更干净、更好读"
    ],
    "conceptCards": [
      {
        "term": "抽象 Abstraction",
        "gloss": "把一坨逻辑取个名字、藏起细节，变成一块可复用积木。"
      },
      {
        "term": "代码复用",
        "gloss": "别复制粘贴同一段积木——做成函数，改一处就处处生效。"
      },
      {
        "term": "参数 Parameters",
        "gloss": "给自定义积木开“输入口”，同一块积木能干不同的活。"
      },
      {
        "term": "模块化",
        "gloss": "把程序拆成有名字的小块，结构更清楚。"
      }
    ],
    "blocks": [
      {
        "cat": "自定义积木",
        "list": "“我的积木” → 制作新积木 · define 定义 · 带标签的输入参数"
      },
      {
        "cat": "配合",
        "list": "当按键 · 如果<> · repeat · 碰到角色? · 改x/y · 移到随机 · round · 计时器"
      }
    ],
    "examples": [
      {
        "name": "恐龙游戏",
        "desc": "把“判断是否到达星星”抽成一个可复用积木。"
      },
      {
        "name": "Balloon",
        "desc": "带参数的自定义积木控制充气/放气。"
      },
      {
        "name": "走路的熊",
        "desc": "多参数自定义积木：走 N 步、用两只脚还是四只脚。"
      }
    ],
    "practice": "把你前面写过的一段重复逻辑，做成一个“我的积木”，然后调用它两次。",
    "takeaway": "抽象 = 给一坨逻辑取名、藏细节。这是从“会写代码”到“会组织代码”的关键一跳。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "0:38",
        "title": "恐龙游戏"
      },
      {
        "ts": "11:56",
        "title": "气球1"
      },
      {
        "ts": "16:52",
        "title": "气球2"
      },
      {
        "ts": "20:41",
        "title": "走路的熊"
      }
    ]
  },
  {
    "n": 9,
    "zh": "从零做一个作品",
    "en": "Building from Scratch",
    "dur": "33:58",
    "videoUrl": "https://cdn.blueplanets.uk/cs50-scratch/week-09.mp4",
    "concepts": [
      "广播",
      "克隆",
      "状态管理",
      "综合"
    ],
    "objectives": [
      "用广播让角色之间互相“发消息”通信",
      "用克隆在运行时动态复制角色（如不断下落的水晶）",
      "综合前八集，独立搭出一个能玩的小游戏"
    ],
    "conceptCards": [
      {
        "term": "广播 / 消息",
        "gloss": "一个角色喊一声，收到的角色各自响应——角色间解耦通信。"
      },
      {
        "term": "克隆 Clone",
        "gloss": "运行时动态复制角色实例，做出“一堆同样的东西”。"
      },
      {
        "term": "游戏状态管理",
        "gloss": "用变量跟踪分数、失误数，决定游戏进程与结束。"
      },
      {
        "term": "综合运用",
        "gloss": "事件+循环+条件+变量+坐标，全用上。"
      }
    ],
    "blocks": [
      {
        "cat": "事件",
        "list": "广播 · 当我收到 · 当角色/舞台被点 · 绿旗 · 当按键"
      },
      {
        "cat": "控制(克隆)",
        "list": "克隆自己 · 当作为克隆体启动 · 删除此克隆 · forever · if · stop all · wait"
      },
      {
        "cat": "运动/变量",
        "list": "改x/y · 滑行 · 指向 · set/change · join · 比较 · 随机 · 碰到"
      }
    ],
    "examples": [
      {
        "name": "Broadcasts",
        "desc": "猫问候恐龙、恐龙收到再回应——去掉写死的时序依赖。"
      },
      {
        "name": "控制鸭子",
        "desc": "点箭头广播 up/down，鸭子响应移动——事件委托。"
      },
      {
        "name": "拜访的鱼 / Stars",
        "desc": "点舞台广播 visit，鱼游向鼠标；点星星生成克隆滑到随机位置。"
      },
      {
        "name": "Crystal Catch(压轴)",
        "desc": "完整接水晶游戏：方向键控制猫、水晶克隆下落、catches 计分、三次 miss 结束、随机横向、结束广播停止。"
      }
    ],
    "practice": "综合前八集，做一个你自己的小游戏（哪怕很小）：要有一个可控制的角色、一个计分变量、一个结束条件。",
    "takeaway": "会广播、会克隆、会管状态，你就能从零搭出真正能玩的作品。这正是编程的乐趣：想法变成能跑的东西。",
    "chapters": [
      {
        "ts": "0:00",
        "title": "开场"
      },
      {
        "ts": "2:57",
        "title": "广播"
      },
      {
        "ts": "5:24",
        "title": "控制鸭子"
      },
      {
        "ts": "8:31",
        "title": "拜访的鱼"
      },
      {
        "ts": "9:38",
        "title": "星星"
      },
      {
        "ts": "11:45",
        "title": "接水晶"
      }
    ]
  }
];

export function getEpisode(n: number): CS50Episode | undefined {
  return cs50Episodes.find((e) => e.n === n);
}
