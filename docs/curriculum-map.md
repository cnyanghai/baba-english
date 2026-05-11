---
name: baba-english Curriculum Map
domain: education
component: curriculum
version: v1.0
last_updated: 2026-05-07
maintained_by: oracle (instructional-designer agent)
based_on: ~/brain/3-Resources/methodologies/04-education-product/
---

# baba-english Curriculum Map v1.0

> 基于 Education Bible 的完整教学设计文档。
> 配套 Bible：[`~/brain/3-Resources/methodologies/04-education-product/`](../../../brain/3-Resources/methodologies/04-education-product/)

---

## 1. Overview

### Logline
> 用美剧 / 电影 / 动画 / TED 的真实切片，让中国学习者**沉浸式习得英语**——看着喜欢的内容自然学会，而非死背单词语法。

### Theme
**Comprehensible Input + Spaced Repetition + Real Context**——Krashen 输入假说 + Wozniak SRS + 真实场景。

### USP（Unique Selling Point）
1. **真实切片 + 双语字幕 + 互动词典**（FluentU 同档质量）
2. **基于剧集追番习惯**（看 Friends 学完一季 = 听力+词汇质变）
3. **AI 辅助 vocab mining + SRS**（不靠用户主动整理）
4. **词源数据 + 文化注释**（46k etymonline + 中文 context）

### Target Learners
- **主战场**：中国 18-35 岁，CEFR A2-B2 之间
- 已有基础（高中 / 大学英语过了）但听力差
- 喜欢美剧 / 电影 / 想要"会用英语"
- 有自学动机但缺方法 / 缺输入

### Sub-Targets
- 出国留学准备（TOEFL / IELTS 听力补齐）
- 海外华人子女（heritage learner）
- 工作英语（商务美剧 + 商务 TED）
- 兴趣型（追剧学英语）

---

## 2. Pedagogical Foundations

### 主要 SLA 理论
- **Krashen Input Hypothesis (i+1)**：每切片含 ≤20% 新词
- **Vygotsky ZPD + Scaffold**：字幕 4 阶段（双语 → 英文 → 无字幕 → 听写）
- **Spaced Repetition (SM-2 / FSRS)**：UserVocabulary status 字段已支持
- **Active Recall (Schmidt Noticing)**：每切片配 quiz / shadowing
- **Lexical Approach (Michael Lewis)**：教 chunks 而非孤立词

### 核心信念
1. 大量 comprehensible input > 少量精准 grinding
2. 兴趣驱动 > 课程驱动（Free Voluntary Reading 思路）
3. Active recall > Passive review
4. Real context > 教材语境

### 反对（不做）
- ❌ 死记单词列表（脱 context 必忘）
- ❌ 强制顺序学习（学习者按兴趣选剧）
- ❌ 罚错（高 affective filter → 流失）
- ❌ 复杂语法讲解（emergent grammar via input）

---

## 3. Learning Outcomes（按 CEFR 等级）

### A2 完成后学习者能：
- **Listening**：听懂日常对话切片（Friends 慢速段）≥70% 关键信息
- **Vocab**：掌握 1500-2000 高频词（CEFR A1-A2）
- **Grammar**：识别 + 理解（不要求产出）现在 / 过去 / 将来时
- **Real-world**：看带字幕美剧能跟上情节
- **Bloom**：Remember + Understand 层

### B1 完成后学习者能：
- **Listening**：听懂普通语速切片 ≥60%
- **Vocab**：3000-3500 词（A2 + B1）
- **Speaking**：用 chunks 表达日常想法（shadowing 评分）
- **Grammar**：理解 + 部分产出 12 时态、被动、虚拟
- **Real-world**：看美剧 50% 不靠字幕能懂
- **Bloom**：Remember + Understand + Apply

### B2 完成后学习者能：
- **Listening**：听懂复杂对话切片（不熟主题）≥70%
- **Vocab**：5000-6000 词（含 collocation）
- **Speaking**：流畅讨论熟悉话题
- **Writing**：写 100-200 字短文，结构清晰
- **Real-world**：看美剧 70% 不靠字幕能懂；TED 演讲能跟得上
- **Bloom**：Remember through Apply + 部分 Analyze

### C1 / C2（长期目标）
- 接近母语，地道表达
- 无字幕看任何剧 / 电影 / 新闻
- Bloom 全层级

---

## 4. Curriculum Structure

### 4.1 内容矩阵（5 大维度）

```
[CEFR 等级] × [Theme] × [Drama Type] × [Difficulty Sub-skill] × [Cultural Context]
```

#### Drama Types（已在 Schema 中定义）
- **DRAMA**：剧集（Friends / Modern Family / The Office / The Big Bang Theory）
- **MOVIE**：电影（Inside Out / Forrest Gump / La La Land）
- **TED**：演讲（A1+ 难度梯度）
- **CARTOON**：动画（Bluey / 海绵宝宝 / Despicable Me）

#### Themes（推荐起步 8 个）
1. Daily Life（日常）
2. Friendship（友情）
3. Family（家庭）
4. Work / Office（职场）
5. Romance（恋爱）
6. Travel（旅行）
7. Food（饮食）
8. Holiday / Culture（节日 / 文化）

### 4.2 学习者进入路径

```
注册
  ↓
Pre-Test（CEFR 评级）
  ↓
推荐 Path
  ├─ Beginner Track：A2 切片（限定 250 个）
  ├─ Intermediate：B1 切片（limited 500）
  └─ Advanced：B2+ 切片（unlimited）
  ↓
学习者选 Theme + Drama
  ↓
开始第一个 Lesson Pack（5 切片）
  ↓
完成 → SRS 复习 → 下一 Pack
```

### 4.3 Lesson Pack 概念

**1 Pack = 5 个相关切片** = 1 周内容 = 25-50 分钟学习。

每 Pack 围绕：
- 1 个 Theme（如 "Coffee Shop Conversation"）
- 1 个 Drama（如 Friends）
- 1 个 CEFR Level
- 含 ~30 个新词（per 学习者过滤后约 15-20 个）

---

## 5. Content Inventory（目标）

### Phase 1 目标（MVP，3-6 月）
| Drama Type | 数量 | CEFR 范围 | 总切片 |
|---|---|---|---|
| DRAMA | 2 季（Friends S01-S02） | A2-B1 | ~400 切片 |
| MOVIE | 5 部（Inside Out / La La Land 等）| B1-B2 | ~150 切片 |
| TED | 20 个（短演讲）| A2-C1 | ~100 切片 |
| CARTOON | 1 季（Bluey）| A1-A2 | ~50 切片 |
| **合计** | | | **~700 切片** |

### Phase 2 目标（6-12 月）
扩展到 ~2000 切片（覆盖更多 themes）

### Phase 3 目标（12-24 月）
~5000+ 切片 + UGC 通道

---

## 6. Lesson Spec 标准

每 lesson（= 1 切片 + 配套）严格按 [`lesson-spec-template.md`](../../../brain/3-Resources/methodologies/04-education-product/05-templates/lesson-spec-template.md) 撰写。

### 必含要素
1. **Pre-Watch**（30s）：主题介绍 + 关键词预告
2. **First Watch**（切片时长，10-60s）
3. **Vocab Mining**（1-2min）：自动 + 手动加 SRS
4. **Detailed Watch**（2-3min）：暂停 + 重听 + 字幕分析
5. **Quiz**（1-2min）：3-5 题混合类型
6. **Production**（2-5min）：Shadowing 录音 + 自评
7. **SRS Schedule**：1d / 7d / 30d 自动调度

### Activity 类型混搭
- **Recognition**（多选 / 真假）
- **Recall**（fill-in-blank）
- **Production**（shadowing / 自由说）
- **Performance**（dictation / repeat）

---

## 7. Assessment Plan

### 7.1 Formative（过程性，80%）
- 每 lesson 后即时 quiz
- SRS 自动复习
- 无 stake（不影响升级）

### 7.2 Summative（总结性，20%）
- 每 Pack 末综合测（5 切片所有 vocab + grammar）
- 每 10 Pack（一个"章"）末做 mini exam
- 阶段升级测：A2 → B1 → B2 必有

### 7.3 Self-Assessment
- 学习者每月填问卷："你觉得自己进步了吗？"
- 跟客观数据对比

### 7.4 Real-World Test
- 推 1 集**完整集**（unsegmented）让学习者自评听懂多少
- 阶段性进步指标

---

## 8. UX Flow

### 主屏（Home）
```
┌────────────────────────────────────────────┐
│  你的 streak: 🔥 12 天          📚 等级 B1  │
│  今日复习：8 个词                              │
│                                              │
│  [继续学习] Friends S01E04 → 第 3 切片       │
│                                              │
│  ── 推荐切片 ──                               │
│  [TED] 5 ways to listen better       ⭐ B1   │
│  [Movie] Inside Out / 离别那段       ⭐ B1   │
│  [Drama] Modern Family S01E07        ⭐ A2+  │
│                                              │
│  ── 你的进度 ──                               │
│  Friends S01：23/45 切片完成                  │
└────────────────────────────────────────────┘
```

### Lesson 屏（核心）
- 视频播放器（中央，60%）
- 字幕区（底部，可 toggle）
- Vocab 侧边栏（右，点词收集）
- 进度条 + 控件（顶部）
- Mobile 优化（单手操作）

### Vocabulary 屏
- 复习卡片（SRS）
- "今日复习 8 个" → 大按钮
- 单词 + 来自切片的句子（context！） + 视频片段

### Progress 屏
- CEFR 进度条
- Streak 日历
- 总学习时长
- Vocab 累计

---

## 9. Tech Stack（已确定）

- **Frontend**：Next.js 14 + React + Tailwind + shadcn UI
- **Backend**：Prisma + PostgreSQL
- **Auth**：NextAuth v5
- **Data**：ECDICT 词典 + Etymonline 词源（46k 词）+ 自研内容
- **AI**：
  - Whisper（自动转录）
  - Claude / GPT-4（翻译 + quiz 生成 + 文化注释）
  - 后期：Speechace（发音评分）

---

## 10. Roadmap（24 月）

### Phase 1 · MVP（M1-6）
- ✅ 数据模型已建（6 张表）
- ✅ Friends S01E01 已处理
- ⏳ 完成 Friends S01 全 22 集 + 其他 4 类内容启动
- ⏳ Click-to-define 互动字幕
- ⏳ SM-2 SRS 引擎
- ⏳ 基础 quiz 系统
- ⏳ Mobile 适配
- 🎯 目标：100 内测用户，留存 D7 ≥30%

### Phase 2 · 增强（M7-12）
- 内容扩到 700+ 切片
- Shadowing + 录音对比
- FSRS 算法（升级 SM-2）
- Streaks + Levels + Achievements
- 文化注释完整
- Pre-Test 系统
- 推荐算法
- Free / Pro 分层（¥30-50/月）
- 🎯 目标：5000 用户，付费率 3%

### Phase 3 · Scale（M13-24）
- 内容 2000-5000 切片
- AI 对话 partner
- 社区 / Discord
- UGC 通道（用户上传切片）
- B2B（学校 / 培训机构）
- 多语言扩展（不只英语）
- 🎯 目标：50k 用户，月入 ¥50 万+

---

## 11. Risks & Mitigations

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| **版权** | 高 | 致命 | 短切片 + 教育目的 + 跟流媒体合作 |
| **内容生产瓶颈** | 高 | 大 | AI 加速 + 后期招内容运营 |
| **DAU 高但学不会**（最危险）| 中 | 大 | Learning Outcome Gate 严守 |
| **付费率低** | 中 | 大 | 分层定价 + Battle Pass 模式 |
| **大厂跟进**（VIPKID / 流利说）| 中 | 大 | 抢内容 + 抢用户 + 差异化（视频切片专精）|
| **服务器成本**（视频 CDN）| 中 | 中 | CDN + 降码率 + 用户付费 cover |

---

## 12. 立刻可执行的 Top 5 任务

基于 Curriculum Map 立刻该做的（按优先级）：

### Task 1：完善 Friends S01 数据
- 当前只有 S01E01
- 目标：完成 S01 全 22 集
- 输出：~440 切片入库
- 周期：4-6 周（人工 + AI 协作）

### Task 2：实现 Click-to-Define 互动字幕
- 现有：基础视频 + 字幕显示
- 加：点词 → 弹定义 + 例句 + 加 SRS 按钮
- 接 ECDICT 词典 + Etymonline 词源
- 周期：2 周

### Task 3：SRS 引擎（SM-2）
- 数据模型已有 UserVocabulary + status
- 加：算法实现 + "今日复习"页面 + 推送
- 周期：3 周

### Task 4：Quiz 系统（每切片 3 题）
- AI 自动生成（GPT-4 / Claude）+ 人工审
- 题型：多选 + fill-in
- 周期：2 周（生成系统 + UI）

### Task 5：Pre-Test（CEFR 评级）
- 用户首次注册测一次
- ~20 题混合（听力 + 词汇 + 语法）
- 输出 CEFR level 推荐起点
- 周期：3 周

**5 任务并行 ~3 个月** → MVP 完整。

---

## 13. 评审与迭代

### Curriculum Gate 已通过 ✓
- Logline 一句话定位 ✓
- Target learners 明确（CEFR A2-B2 中国学习者）✓
- Outcomes 含 Bloom 各层 ✓
- Backward design 应用 ✓
- SLA 理论基础（Krashen / Vygotsky / Schmidt）✓
- 8 个 theme 设计 ✓
- Multimodal 多模态 ✓
- Mobile-first ✓

### 月度 Review 节点
- M1：MVP 启动后第 1 月
- M3：第 1 次大评审（数据 + 用户反馈）
- M6：MVP 完整后整体审查 + Phase 2 规划

---

## 14. Evolution Log

### v1.0 (2026-05-07)
- 初稿，基于 Education Bible v0.1 完整撰写
- 基于 baba-english 现有数据模型 + Friends S01E01 实战
- 通过 Curriculum Gate 8 项 checklist
- Top 5 立即任务清单

### v0.0
- baba-english 已有：6 张数据表 + Friends S01E01 转录 + 词典数据
- 之前缺：完整 curriculum 设计 / Pedagogical 理论框架 / Roadmap

---

*本 Curriculum Map 是 baba-english 项目的"宪法"——所有 lesson 设计 / 内容选择 / 功能规划必须服从。修订需按 [Bible Evolution Log](../../../brain/3-Resources/methodologies/_meta/bible_evolution_log.md) 流程。*
