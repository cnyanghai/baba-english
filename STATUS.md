---
type: status
status: active
cluster: product
stage: 代码已推上 GitHub（github.com/cnyanghai/baba-english，Public），本地 main 与远端对齐
next: 回到产品本身——确认 09-03 前后在做什么；archive/magic-school-math 分支要不要也推（含商户号，推前需同样洗）
blocked_by:
updated: 2026-10-17
---

# 状态

## 现在停在哪

- 线上：https://baba.wogucloud.cn（DMIT2，/opt/baba-english，pm2 + 宿主 nginx + docker pg）
- 2026-08-06 从「麦哲学院」多学院回退到 v0.1「Baba 英语」：看剧学英语（哈利波特、老友记）+ 生词本 + 付费。数学、深讲、ELA 归档在 `archive/magic-school-math` 分支
- 2026-08-07 上线「英语绘本」书本阅读器 `/books`，首本哈利波特开篇
- 少儿编程学习路线：CS50 九集自托管视频已上 R2，公网可播
- **2026-10-19 研习录搬进来（分支 `yanxilu`，待部署）**：首页 `/` 换成研习录，原首页挪到 `/english`；看剧逐句学、生词本、学习进度成了研习录书架「英语」一层的功能。部署步骤见 `docs/yanxilu.md`
- **2026-10-17 已推上 GitHub**：https://github.com/cnyanghai/baba-english （Public，119 个文件，HEAD `2ccfa9e`）
  - 自 2026-05-11 以来积压的改动（绘本阅读器 + 少儿编程路线 + 样式调整，38 个文件）已提交为 `1c0c66a`
  - `.gitignore` 增补 `.claude/worktrees/`（89M 本地产物）
  - 公开前扫查：`.env`（DATABASE_URL / AUTH_SECRET）从未进过任何提交；微信私钥在服务器 `/opt/baba-secrets/`，不在仓库；支付/短信凭证全走环境变量
  - 用户选 Public，并选择洗掉 `src/lib/wxpay.ts` 注释里的真实微信商户号（该号也在历史提交 58a8de5 里）
  - `filter-branch` 被安全策略拦下，改为**非破坏性重放**：新建 `publish` 分支，从 `a8c3d3c` 起重放 2 个提交并在重放时洗号 → `c247a16`、`cd90fc9`，逐提交 grep 确认历史无残留；与 `main` 的树差异只有那一行注释
  - 推送体积约 5.4 MB（node_modules / data 大字典 / .venv / .claude/worktrees 已排除）
  - `gh repo create` 被 fine-grained PAT 挡住（无 Administration 权限），由用户手动建空仓，推送走 SSH
  - 本地 `main` 已指到 `2ccfa9e` 并跟踪 `origin/main`，`publish` 分支已删；旧 main `1c0c66a` 留在 reflog
  - 推后复核：远端无 `.env`／`.pem`，商户号 0 命中

## 下一步

1. 回到产品本身：确认 09-03 前后在做什么（原「下一步」遗留问题）
2. `archive/magic-school-math`（10 个提交，麦哲学院/数学/深讲归档）还只在本地。要推的话得先同样洗掉 `src/lib/wxpay.ts` 里的商户号
3. 以后在 `main` 上开发直接 push 即可，远端已就位

## 已定决策

- 2026-10-17 仓库公开（Public）；洗掉微信商户号，Cloudflare 账号 ID 拼的 R2 S3 端点保留在 `scripts/`（非凭证，无访问能力）
- 2026-08-06 放弃"大而全"多学院路线，回退 v0.1 —— 用户判定方向不对，先把单一场景做好
- 智慧树社交构想以这个项目作沙盒，见记忆 project_wisdom_tree_social

## 未决问题

- 智慧树社交构想是否还在这个项目里推进
- 公开仓库里带第三方内容（哈利波特绘本图 10 张、CS50 字幕 9 集）—— 用户已知情并选择公开，后续若有版权顾虑需另行处理

## 日志

- 2026-10-19 研习录搬进 Baba：新表 YxlDoc / YxlFile，接口 /api/yxl/*，首页换成研习录（分支 yanxilu）
- 2026-10-17 代码推上 GitHub（Public），洗掉历史里的微信商户号，本地 main 与远端对齐
- 2026-09-15 建立 STATUS.md
- 2026-08-07 英语绘本上线
- 2026-08-06 回退 v0.1
