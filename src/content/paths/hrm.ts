// Human Resource Machine 关卡攻略（1–41 全关）。解法经 cowboy/human-resource-machine-solutions 核准。
// 静态数据，不进 DB。coffee=true 为剧情过场（无代码）。

export type HRMLevel = {
  n: string;
  zh: string;
  en: string;
  concept: string;
  coffee?: boolean;
  goal: string;
  code?: string;
  expl?: string;
};

export const hrmLevels: HRMLevel[] = [
  {
    "n": "1",
    "zh": "收发室",
    "en": "Mail Room",
    "concept": "顺序 · 输入输出",
    "goal": "把 INBOX 里的三样东西，一件一件搬到 OUTBOX。",
    "code": "INBOX\nOUTBOX\nINBOX\nOUTBOX\nINBOX\nOUTBOX",
    "expl": "inbox 从进货口拿一件、outbox 往出货口送一件，重复三次。这是最基础的“取输入、给输出”，先熟悉两条命令。"
  },
  {
    "n": "2",
    "zh": "忙碌收发室",
    "en": "Busy Mail Room",
    "concept": "循环 ★",
    "goal": "不管 INBOX 里有几件，全部原样搬到 OUTBOX。",
    "code": "a:\n    INBOX\n    OUTBOX\n    JUMP  a",
    "expl": "jump a 让程序不断跳回标签 a，形成循环——只写一次、重复执行；INBOX 空了游戏自动结束。核心一句：别重复自己，让机器重复。"
  },
  {
    "n": "3",
    "zh": "拷贝地板",
    "en": "Copy Floor",
    "concept": "内存 · 按编号取",
    "goal": "地板上摆着一排字母方块。按题目要求，把其中三个（正好在 4、0、3 号格）按这个顺序送出去。",
    "code": "COPYFROM 4\nOUTBOX\nCOPYFROM 0\nOUTBOX\nCOPYFROM 3\nOUTBOX",
    "expl": "copyfrom N = 从 N 号地板格把东西拿到手上（不清空原格）。地板格就是能“按编号存取”的抽屉——这是内存/变量最朴素的样子。"
  },
  {
    "n": "4",
    "zh": "乱序处理器",
    "en": "Scrambler Handler",
    "concept": "暂存 · 交换顺序",
    "goal": "INBOX 里的东西成对出现。把每一对的前后两个“调个个儿”，再送出去。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    INBOX\n    OUTBOX\n    COPYFROM 0\n    OUTBOX\n    JUMP     a",
    "expl": "先拿第一个、copyto 0 存进 0 号格暂存；再拿第二个直接送出；最后把 0 号格里存的第一个送出——两个的顺序就换过来了。这就是“用一个临时变量交换”。"
  },
  {
    "n": "5",
    "zh": "咖啡时间",
    "en": "Coffee Time",
    "concept": "过场 · 无代码",
    "coffee": true,
    "goal": "这一关是剧情过场——喝杯咖啡、歇口气，没有编程任务，直接进入下一关。",
    "code": "",
    "expl": ""
  },
  {
    "n": "6",
    "zh": "多雨的夏天",
    "en": "Rainy Summer",
    "concept": "加法 ADD",
    "goal": "INBOX 成对出现。把每一对的两个数相加，送出它们的和。",
    "code": "a:\n    INBOX\n    COPYTO 0\n    INBOX\n    ADD    0\n    OUTBOX\n    JUMP   a",
    "expl": "第一个数存进 0 号格；拿第二个时 add 0 = 手上的数 + 0号格的数，得到和再送出。第一次用到 ADD——让程序会算数。"
  },
  {
    "n": "7",
    "zh": "零的歼灭者",
    "en": "Zero Exterminator",
    "concept": "条件跳转 · 判零",
    "goal": "把 INBOX 里的东西送出去，但把所有的 0 都扔掉、不要送。",
    "code": "a:\n    INBOX\n    JUMPZ a\n    OUTBOX\n    JUMP  a",
    "expl": "JUMPZ = 如果手上的值是 0 就跳转。这里“是 0 就跳回开头重新拿”（等于丢弃这个 0），不是 0 才送出。第一次“看情况做决定”的条件分支。"
  },
  {
    "n": "8",
    "zh": "三倍房间",
    "en": "Tripler Room",
    "concept": "乘法=重复加法",
    "goal": "把 INBOX 里的每个数乘以 3，送出结果。",
    "code": "a:\n    INBOX\n    COPYTO 0\n    ADD    0\n    ADD    0\n    OUTBOX\n    JUMP   a",
    "expl": "机器没有乘法，就用加法凑：存一份 x 到 0 号格，手上是 x，add 0 → 2x，再 add 0 → 3x。记住：乘法就是重复的加法。"
  },
  {
    "n": "9",
    "zh": "保零计划",
    "en": "Zero Preservation Initiative",
    "concept": "条件 · 反向过滤",
    "goal": "和第 7 关正好相反——只把 0 送出去，其它数字全部扔掉。",
    "code": "    JUMP c\na:\n    OUTBOX\nb:\nc:\n    INBOX\n    JUMPZ a\n    JUMP  b",
    "expl": "拿一个数：如果是 0（JUMPZ 成立）就跳去 outbox 送出；不是 0 就跳回去重拿、丢掉。同一个 JUMPZ，把“成立时去哪”换一下，就从“扔掉0”变成“只留0”。"
  },
  {
    "n": "10",
    "zh": "八倍套间",
    "en": "Octoplier Suite",
    "concept": "倍增技巧 ×8",
    "goal": "把 INBOX 里的每个数乘以 8，送出结果。",
    "code": "a:\n    INBOX\n    COPYTO 0\n    ADD    0\n    COPYTO 0\n    ADD    0\n    COPYTO 0\n    ADD    0\n    OUTBOX\n    JUMP   a",
    "expl": "不用傻加 8 次。每次把当前结果存回 0 号格再自加：x → 2x → 4x → 8x，三次翻倍就到 8 倍。这叫“倍增”，比一个个加快得多——效率意识从这里开始。"
  },
  {
    "n": "11",
    "zh": "暗巷减法",
    "en": "Sub Hallway",
    "concept": "减法 SUB",
    "goal": "INBOX 成对出现。每对输出两个方向的差：先 b−a，再 a−b。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    INBOX\n    COPYTO   1\n    SUB      0\n    OUTBOX\n    COPYFROM 0\n    SUB      1\n    OUTBOX\n    JUMP     a",
    "expl": "SUB 是减法命令。把 a、b 分别暂存到 0、1 号格，正着减一次、反着减一次，各输出一个。第一次用到减法。"
  },
  {
    "n": "12",
    "zh": "四十倍器",
    "en": "Tetracontiplier",
    "concept": "乘法 · 倍增",
    "goal": "把每个数乘以 40。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    ADD      0\n    COPYTO   0\n    ADD      0\n    COPYTO   0\n    ADD      0\n    COPYTO   0\n    ADD      0\n    ADD      0\n    ADD      0\n    ADD      0\n    OUTBOX\n    JUMP     a",
    "expl": "先连续翻倍得到 8 倍（×2×2×2），再把这 8 倍自加到 40 倍（8×5）。大乘数的诀窍：先翻倍逼近、再累加，比一个个加省得多。"
  },
  {
    "n": "13",
    "zh": "相等房间",
    "en": "Equalization Room",
    "concept": "相等判断",
    "goal": "INBOX 成对。两数相等就输出其中一个，不等就都扔掉。",
    "code": "    JUMP     b\na:\n    COPYFROM 0\n    OUTBOX\nb:\nc:\n    INBOX\n    COPYTO   0\n    INBOX\n    SUB      0\n    JUMPZ    a\n    JUMP     c",
    "expl": "两数相减，若差为 0（JUMPZ 成立）说明相等、就输出；否则跳过。“相减是不是 0”正是编程里判断两值相等的底层做法。"
  },
  {
    "n": "14",
    "zh": "取大房间",
    "en": "Maximization Room",
    "concept": "比较 · 取最大",
    "goal": "INBOX 成对。输出较大的那个。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    INBOX\n    SUB      0\n    JUMPN    b\n    ADD      0\n    JUMP     c\nb:\n    COPYFROM 0\nc:\n    OUTBOX\n    JUMP     a",
    "expl": "算 a−b：若为负（JUMPN 成立）说明 a 小、输出 b；否则输出 a。“相减看正负”是比大小的通用手段。"
  },
  {
    "n": "15",
    "zh": "过场",
    "en": "",
    "concept": "过场",
    "goal": "这一关是剧情过场，没有编程任务。",
    "coffee": true
  },
  {
    "n": "16",
    "zh": "绝对正能量",
    "en": "Absolute Positivity",
    "concept": "条件 · 绝对值",
    "goal": "把每个数变成非负：负数取相反数，正数原样输出。",
    "code": "    JUMP     c\na:\n    COPYTO   0\n    SUB      0\n    SUB      0\nb:\n    OUTBOX\nc:\n    INBOX\n    JUMPN    a\n    JUMP     b",
    "expl": "若是负数（JUMPN），用“0 减两次”把它翻正（x−x−x = −x）；正数直接输出。绝对值 = 去掉符号、只留大小。"
  },
  {
    "n": "17",
    "zh": "专属休息厅",
    "en": "Exclusive Lounge",
    "concept": "条件 · 异或",
    "goal": "INBOX 成对。两数“同号还是异号”，分别输出地板上预存的两个标记之一。",
    "code": "a:\n    INBOX\n    JUMPN    c\n    INBOX\n    JUMPN    d\nb:\n    COPYFROM 4\n    JUMP     e\nc:\n    INBOX\n    JUMPN    b\nd:\n    COPYFROM 5\ne:\n    OUTBOX\n    JUMP     a",
    "expl": "分别判断两个数的正负，符号相同和不同走不同分支。这就是“异或（XOR）”的思想：两者不一样时为真。"
  },
  {
    "n": "18",
    "zh": "过场",
    "en": "",
    "concept": "过场",
    "goal": "这一关是剧情过场，没有编程任务。",
    "coffee": true
  },
  {
    "n": "19",
    "zh": "倒计时",
    "en": "Countdown",
    "concept": "循环 · 计数",
    "goal": "对每个数，从它一路数到 0，逐个输出（正数递减、负数递增）。",
    "code": "a:\n    INBOX\n    COPYTO   0\nb:\nc:\n    OUTBOX\n    COPYFROM 0\n    JUMPZ    a\n    JUMPN    d\n    BUMPDN   0\n    JUMP     b\nd:\n    BUMPUP   0\n    JUMP     c",
    "expl": "每次输出当前值，再朝 0 挪一步：正数用 BUMPDN 减 1、负数用 BUMPUP 加 1，到 0 就停。BUMPUP/BUMPDN 是“某格 ±1”的快捷命令。"
  },
  {
    "n": "20",
    "zh": "乘法车间",
    "en": "Multiplication Workshop",
    "concept": "乘法 = 重复加法",
    "goal": "INBOX 成对。输出两数之积 a×b。",
    "code": "a:\n    COPYFROM 9\n    COPYTO   4\n    INBOX\n    COPYTO   1\n    INBOX\n    COPYTO   0\nb:\n    JUMPZ    c\n    COPYFROM 4\n    ADD      1\n    COPYTO   4\n    BUMPDN   0\n    JUMP     b\nc:\n    COPYFROM 4\n    OUTBOX\n    JUMP     a",
    "expl": "机器没有乘法，就把 a 累加 b 次：用一个计数器存 b，每加一次就减 1，减到 0 停。乘法的本质就是“把一个数加另一个数那么多次”。"
  },
  {
    "n": "21",
    "zh": "零止求和",
    "en": "Zero Terminated Sum",
    "concept": "循环 · 哨兵值",
    "goal": "INBOX 是若干段，每段以 0 结尾。输出每一段的和。",
    "code": "a:\n    INBOX\n    JUMPZ    d\nb:\n    COPYTO   0\n    INBOX\n    JUMPZ    c\n    ADD      0\n    JUMP     b\nc:\n    COPYFROM 0\nd:\n    OUTBOX\n    JUMP     a",
    "expl": "一路累加，直到碰到 0（哨兵/终止符）就输出这段的和、重新开始。用一个特殊值 0 标记“段结束”，真实数据里很常见（如字符串的结尾）。"
  },
  {
    "n": "22",
    "zh": "斐波那契访客",
    "en": "Fibonacci Visitor",
    "concept": "变量 · 数列递推",
    "goal": "对每个输入 n，输出不超过 n 的斐波那契数列（1,1,2,3,5,8…）。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    COPYFROM 9\n    COPYTO   1\n    COPYTO   2\n    BUMPUP   2\nb:\n    OUTBOX\n    COPYFROM 1\n    ADD      2\n    COPYTO   3\n    COPYFROM 0\n    SUB      3\n    JUMPN    a\n    COPYFROM 2\n    COPYTO   1\n    COPYFROM 3\n    COPYTO   2\n    JUMP     b",
    "expl": "用两个格子记住“前两项”，每次输出当前项、再把两项相加得下一项，直到超过 n。斐波那契就是“下一项 = 前两项之和”的经典递推。"
  },
  {
    "n": "23",
    "zh": "最小的数",
    "en": "The Littlest Number",
    "concept": "比较 · 求最小",
    "goal": "每段（0 结尾）里，输出最小的那个数。",
    "code": "    JUMP     b\na:\n    COPYFROM 0\n    OUTBOX\nb:\n    INBOX\n    JUMP     d\nc:\n    ADD      0\nd:\n    COPYTO   0\ne:\n    INBOX\n    JUMPZ    a\n    SUB      0\n    JUMPN    c\n    JUMP     e",
    "expl": "记住“目前最小”，每来一个就比一比、更小就替换；到段尾输出冠军。这是“擂台式”求最值：保留当前最好，逐个挑战。"
  },
  {
    "n": "24",
    "zh": "取余模块",
    "en": "Mod Module",
    "concept": "取余 = 反复减",
    "goal": "INBOX 成对。输出 a mod b（a 除以 b 的余数）。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    INBOX\n    COPYTO   1\n    COPYFROM 0\nb:\n    SUB      1\n    JUMPN    c\n    JUMP     b\nc:\n    ADD      1\n    OUTBOX\n    JUMP     a",
    "expl": "用 a 反复减 b，直到再减就变负——最后剩下的就是余数。取余的本质是“减到不够减为止，剩多少”。"
  },
  {
    "n": "25",
    "zh": "累计倒数",
    "en": "Cumulative Countdown",
    "concept": "循环 · 累加",
    "goal": "对每个 n，输出 n+(n−1)+…+1 的总和。",
    "code": "a:\n    INBOX\n    JUMPZ    d\n    COPYTO   1\nb:\n    COPYTO   0\n    BUMPDN   1\n    JUMPZ    c\n    ADD      0\n    JUMP     b\nc:\n    COPYFROM 0\nd:\n    OUTBOX\n    JUMP     a",
    "expl": "从 n 开始，把 n、n−1、n−2… 一直加到 1。等差数列求和最朴素的写法：一个个加起来。"
  },
  {
    "n": "26",
    "zh": "短除法",
    "en": "Small Divide",
    "concept": "除法 = 数减几次",
    "goal": "INBOX 成对。输出 a÷b 的商（整数，向下取整）。",
    "code": "a:\n    COPYFROM 9\n    COPYTO   7\n    INBOX\n    COPYTO   0\n    INBOX\n    COPYTO   1\nb:\n    COPYFROM 0\n    SUB      1\n    JUMPN    c\n    COPYTO   0\n    BUMPUP   7\n    JUMP     b\nc:\n    COPYFROM 7\n    OUTBOX\n    JUMP     a",
    "expl": "数 a 里能减掉几个 b，商就是几。用计数器记录减的次数，减到不够为止。除法就是“反复减、数次数”，和取余（第 24 关）是一对孪生。"
  },
  {
    "n": "27",
    "zh": "过场",
    "en": "",
    "concept": "过场",
    "goal": "这一关是剧情过场，没有编程任务。",
    "coffee": true
  },
  {
    "n": "28",
    "zh": "三数排序",
    "en": "Three Sort",
    "concept": "排序 · 比较交换",
    "goal": "每三个数一组，从小到大排好序输出。",
    "code": "a:\n    INBOX\n    COPYTO   0\n    INBOX\n    COPYTO   1\n    INBOX\n    COPYTO   2\n    SUB      1\n    JUMPN    c\nb:\n    COPYFROM 2\n    COPYTO   3\n    COPYFROM 1\n    COPYTO   2\n    COPYFROM 3\n    COPYTO   1\nc:\n    COPYFROM 1\n    SUB      0\n    JUMPN    d\n    COPYFROM 1\n    COPYTO   3\n    COPYFROM 0\n    COPYTO   1\n    COPYFROM 3\n    COPYTO   0\nd:\n    COPYFROM 1\n    SUB      2\n    JUMPN    b\n    COPYFROM 2\n    OUTBOX\n    COPYFROM 1\n    OUTBOX\n    COPYFROM 0\n    OUTBOX\n    JUMP     a",
    "expl": "三个数两两比较，谁小谁靠前，需要时交换位置，比完输出。这是“排序”的最小案例；再多的数也是同样“比较+交换”反复做（见第 41 关）。"
  },
  {
    "n": "29",
    "zh": "存储楼层",
    "en": "Storage Floor",
    "concept": "指针 · 间接寻址",
    "goal": "INBOX 给一个地址编号，输出地板上那个编号格子里的东西。",
    "code": "a:\n    INBOX\n    COPYTO   10\n    COPYFROM [10]\n    OUTBOX\n    JUMP     a",
    "expl": "`COPYFROM [10]` 是关键——方括号表示“取 10 号格里存的数当地址、再去那个地址取值”。这就是指针/间接寻址：格子里存的不是数据，而是“数据在哪”。"
  },
  {
    "n": "30",
    "zh": "字符串存储楼层",
    "en": "String Storage Floor",
    "concept": "指针 · 字符串",
    "goal": "INBOX 给一个起始地址，从那里开始输出一串字母，直到遇到 0（结尾）。",
    "code": "a:\n    INBOX\n    COPYTO   24\nb:\n    COPYFROM [24]\n    JUMPZ    a\n    OUTBOX\n    BUMPUP   24\n    JUMP     b",
    "expl": "用间接寻址从起点逐格读取，读到 0 就停。字符串在内存里就是“一串连续字符 + 一个结尾标记 0”——这里第一次把指针和字符串合起来用。"
  },
  {
    "n": "31",
    "zh": "字符串反转",
    "en": "String Reverse",
    "concept": "栈 · 反转",
    "goal": "读入一个以 0 结尾的字符串，倒着输出它。",
    "code": "a:\nb:\n    BUMPUP   14\n    INBOX\n    JUMPZ    c\n    COPYTO   [14]\n    JUMP     b\nc:\nd:\n    BUMPDN   14\n    JUMPZ    a\n    COPYFROM [14]\n    OUTBOX\n    JUMP     d",
    "expl": "先把字符一个个存进连续的格子（指针向上走），到结尾再从最后一格往回读（指针向下走）。“后进先出”正是“栈”的思想，反转是它最经典的用途。"
  },
  {
    "n": "32",
    "zh": "库存报告",
    "en": "Inventory Report",
    "concept": "遍历 · 计数",
    "goal": "对每个输入值，数一数它在地板上那串数里出现了几次，输出次数。",
    "code": "a:\n    INBOX\n    COPYTO   16\n    COPYFROM 14\n    COPYTO   15\n    COPYTO   17\nb:\n    COPYFROM [15]\n    JUMPZ    e\n    SUB      16\n    JUMPZ    d\nc:\n    BUMPUP   15\n    JUMP     b\nd:\n    BUMPUP   17\n    JUMP     c\ne:\n    COPYFROM 17\n    OUTBOX\n    JUMP     a",
    "expl": "从头到尾扫一遍地板列表，每个都和目标比一比，相等就计数 +1，扫到 0 结束、输出计数。“遍历一遍、边走边数”是最基础的统计操作。"
  },
  {
    "n": "33",
    "zh": "过场",
    "en": "",
    "concept": "过场",
    "goal": "这一关是剧情过场，没有编程任务。",
    "coffee": true
  },
  {
    "n": "34",
    "zh": "元音焚化炉",
    "en": "Vowel Incinerator",
    "concept": "字符串 · 过滤",
    "goal": "读入一个字符串，输出它、但烧掉所有元音（A E I O U）。",
    "code": "    JUMP     c\na:\n    COPYFROM 7\n    OUTBOX\nb:\nc:\n    INBOX\n    COPYTO   7\n    COPYFROM 5\n    COPYTO   6\nd:\n    COPYFROM [6]\n    JUMPZ    a\n    SUB      7\n    JUMPZ    b\n    BUMPUP   6\n    JUMP     d",
    "expl": "每读一个字母，挨个和地板上预存的 5 个元音比一比：撞上任何一个就跳过不输出，否则原样送出。“逐个对照黑名单过滤”是文本处理的常见套路。"
  },
  {
    "n": "35",
    "zh": "去重",
    "en": "Duplicate Removal",
    "concept": "去重 · 查表",
    "goal": "读入一个字符串，每个字母只留第一次出现，重复的删掉。",
    "code": "    COPYFROM 14\n    JUMP     b\na:\n    COPYFROM 11\n    COPYTO   [14]\n    OUTBOX\n    BUMPUP   14\n    SUB      14\nb:\n    COPYTO   [14]\nc:\n    COPYTO   14\n    INBOX\n    COPYTO   11\nd:\n    COPYFROM [14]\n    JUMPZ    a\n    SUB      11\n    JUMPZ    c\n    BUMPUP   14\n    JUMP     d",
    "expl": "每输出一个字母，就把它记进一张“见过的表”；后面再遇到就查表、见过就跳过。“用一张表记录见过什么”是去重的通用办法（哈希集合的雏形）。"
  },
  {
    "n": "36",
    "zh": "字典排序器",
    "en": "Alphabetizer",
    "concept": "字符串比较 · 字典序",
    "goal": "给两个字符串，输出按字典顺序排在前面的那个。",
    "code": "a:\nb:\n    COPYFROM 23\n    COPYTO   22\nc:\n    INBOX\n    COPYTO   [22]\n    JUMPZ    d\n    BUMPUP   22\n    JUMP     c\nd:\n    COPYFROM 23\n    COPYTO   22\ne:\n    COPYFROM [22]\n    JUMPZ    j\n    INBOX\n    COPYTO   21\n    JUMPZ    a\n    SUB      [22]\n    JUMPZ    f\n    JUMPN    l\n    JUMP     g\nf:\n    COPYFROM 21\n    OUTBOX\n    BUMPUP   22\n    JUMP     e\ng:\nh:\n    COPYFROM [22]\n    JUMPZ    i\n    OUTBOX\n    BUMPUP   22\n    JUMP     h\ni:\nj:\nk:\n    INBOX\n    JUMP     k\nl:\n    COPYFROM 21\n    OUTBOX\nm:\n    INBOX\n    JUMPZ    b\n    OUTBOX\n    JUMP     m",
    "expl": "从头逐字符比较两个字符串：第一个不同的位置谁的字母小谁排前；若一个是另一个的前缀，短的排前。“逐字符比大小”就是字典序，也是所有文字排序的基础。"
  },
  {
    "n": "37",
    "zh": "寻宝链",
    "en": "Scavenger Chain",
    "concept": "链表 · 指针跳转",
    "goal": "地板上是一条寻宝链：每站存着[一个字母, 下一站地址]。INBOX 给起点，顺着链一路输出字母，直到走到头。",
    "code": "a:\n    INBOX\nb:\n    COPYTO   22\n    COPYFROM [22]\n    OUTBOX\n    BUMPUP   22\n    COPYFROM [22]\n    JUMPN    a\n    JUMP     b",
    "expl": "读出当前站的字母输出，再读出“下一站地址”跳过去，直到地址为负（链尾）。这就是“链表”：数据不必连续摆放，每个节点自己记着“下一个在哪”。"
  },
  {
    "n": "38",
    "zh": "数字爆破",
    "en": "Digit Exploder",
    "concept": "除法 · 拆数位",
    "goal": "把每个三位数拆成单个数字输出（如 123 → 1、2、3）。",
    "code": "a:\n    COPYFROM 9\n    COPYTO   0\n    COPYTO   1\n    INBOX\n    COPYTO   2\nb:\n    COPYFROM 2\n    SUB      11\n    JUMPN    c\n    COPYTO   2\n    BUMPUP   0\n    JUMP     b\nc:\nd:\n    COPYFROM 2\n    SUB      10\n    JUMPN    e\n    COPYTO   2\n    BUMPUP   1\n    JUMP     d\ne:\n    COPYFROM 0\n    JUMPZ    f\n    OUTBOX\n    JUMP     g\nf:\n    COPYFROM 1\n    JUMPZ    h\ng:\n    COPYFROM 1\n    OUTBOX\nh:\n    COPYFROM 2\n    OUTBOX\n    JUMP     a",
    "expl": "除以 100 得百位、余数再除以 10 得十位、剩下的是个位。“除法取商和余数”就能把一个数按位拆开——这是进制的核心操作。"
  },
  {
    "n": "39",
    "zh": "重定坐标",
    "en": "Re-Coordinator",
    "concept": "除法 · 商与余数",
    "goal": "对每个输入，求它除以每行宽度（这里是 15）的商和余数，分别输出——相当于把线性编号换算成网格的行、列坐标。",
    "code": "    JUMP     b\na:\n    ADD      15\n    OUTBOX\n    COPYFROM 1\n    OUTBOX\nb:\n    COPYFROM 14\n    COPYTO   1\n    INBOX\nc:\n    SUB      15\n    JUMPN    a\n    COPYTO   0\n    BUMPUP   1\n    COPYFROM 0\n    JUMP     c",
    "expl": "反复减 15、数减了几次（商=行），减到不够、剩下的（余数=列）。一次除法同时给出商和余数，正是“一维编号 ↔ 二维坐标”互换的关键。"
  },
  {
    "n": "40",
    "zh": "质数工厂",
    "en": "Prime Factory",
    "concept": "质因数分解",
    "goal": "把每个数分解成质因数，从小到大逐个输出（如 12 → 2、2、3）。",
    "code": "    COPYFROM 24\na:\n    COPYTO   5\n    COPYTO   2\n    BUMPUP   5\n    INBOX\n    COPYTO   0\nb:\n    BUMPUP   5\nc:\n    COPYFROM 24\n    COPYTO   1\n    COPYTO   2\n    BUMPDN   0\n    JUMPZ    a\n    BUMPUP   0\nd:\n    SUB      5\n    JUMPN    b\n    COPYTO   2\n    BUMPUP   1\n    COPYFROM 2\n    JUMPZ    e\n    JUMP     d\ne:\n    COPYFROM 5\n    OUTBOX\n    COPYFROM 1\n    COPYTO   0\n    JUMP     c",
    "expl": "从最小的质数 2 开始试除：能整除就输出这个因子、并把数除掉；除不尽就换更大的除数，直到剩 1。这是“质因数分解”，也是很多数学/密码学问题的地基——难度已相当高。"
  },
  {
    "n": "41",
    "zh": "排序楼层",
    "en": "Sorting Floor",
    "concept": "排序算法",
    "goal": "读入一串以 0 结尾的数，全部存到地板上，从小到大排好序后输出。",
    "code": "a:\nb:\n    BUMPUP   24\n    INBOX\n    JUMPZ    d\n    COPYTO   [24]\n    JUMP     a\nc:\n    COPYFROM [19]\n    OUTBOX\n    COPYFROM [24]\n    COPYTO   [19]\nd:\n    BUMPDN   24\n    JUMPZ    b\n    COPYTO   23\ne:\n    COPYFROM 23\n    COPYTO   19\nf:\n    BUMPDN   23\n    JUMPZ    c\n    COPYFROM [23]\n    SUB      [19]\n    JUMPN    e\n    JUMP     f",
    "expl": "把所有数先存下来，再反复扫描、每轮挑出剩下里最小的一个输出（选择排序）。这是完整的“排序算法”——第 28 关三个数的放大版，也是计算机最核心的基本功之一。"
  }
];
