---
type: status
status: active
cluster: product
stage: 代码已全部提交；已备好洗过敏感标识的 publish 分支，等用户在 GitHub 建空仓后推送
next: 用户建 github.com/cnyanghai/baba-english（Public、空仓）→ 推送 publish:main → 把本地 main 指到洗过的提交
blocked_by: 等用户手动建 GitHub 空仓（当前 gh token 是 fine-grained PAT，无建仓权限）
updated: 2026-10-17
---

# 状态

## 现在停在哪

- 线上：https://baba.wogucloud.cn（DMIT2，/opt/baba-english，pm2 + 宿主 nginx + docker pg）
- 2026-08-06 从「麦哲学院」多学院回退到 v0.1「Baba 英语」：看剧学英语（哈利波特、老友记）+ 生词本 + 付费。数学、深讲、ELA 归档在 `archive/magic-school-math` 分支
- 2026-08-07 上线「英语绘本」书本阅读器 `/books`，首本哈利波特开篇
- 少儿编程学习路线：CS50 九集自托管视频已上 R2，公网可播
- **2026-10-17 推 GitHub 进行中**：
  - 自 2026-05-11 以来积压的改动（绘本阅读器 + 少儿编程路线 + 样式调整，38 个文件）已提交为 `1c0c66a`
  - `.gitignore` 增补 `.claude/worktrees/`（89M 本地产物）
  - 公开前扫查：`.env`（DATABASE_URL / AUTH_SECRET）从未进过任何提交；微信私钥在服务器 `/opt/baba-secrets/`，不在仓库；支付/短信凭证全走环境变量
  - 用户选 Public，并选择洗掉 `src/lib/wxpay.ts` 注释里的真实微信商户号（该号也在历史提交 58a8de5 里）
  - `filter-branch` 被安全策略拦下，改为**非破坏性重放**：新建 `publish` 分支，从 `a8c3d3c` 起重放 2 个提交并在重放时洗号 → `c247a16`、`cd90fc9`，逐提交 grep 确认历史无残留；与 `main` 的树差异只有那一行注释
  - 推送体积约 5.4 MB（node_modules / data 大字典 / .venv / .claude/worktrees 已排除）
  - **本地 `main` 仍是旧的、带商户号的历史**，尚未动

## 下一步

1. 用户在 https://github.com/new 建 `baba-english`，Public，不勾 README/.gitignore/license
2. `git push -u origin publish:main`（SSH 已验证可用，`gh` 的 PAT 只缺建仓权限）
3. 推送成功后把本地 `main` 指到 `cd90fc9`（破坏性操作，需用户批准），删掉 `publish` 分支，避免以后在 main 上开发又把带商户号的旧历史带上去
4. 回到产品本身：确认 09-03 前后在做什么（原「下一步」遗留问题）

## 已定决策

- 2026-10-17 仓库公开（Public）；洗掉微信商户号，Cloudflare 账号 ID 拼的 R2 S3 端点保留在 `scripts/`（非凭证，无访问能力）
- 2026-08-06 放弃"大而全"多学院路线，回退 v0.1 —— 用户判定方向不对，先把单一场景做好
- 智慧树社交构想以这个项目作沙盒，见记忆 project_wisdom_tree_social

## 未决问题

- 智慧树社交构想是否还在这个项目里推进
- 公开仓库里带第三方内容（哈利波特绘本图 10 张、CS50 字幕 9 集）—— 用户已知情并选择公开，后续若有版权顾虑需另行处理

## 日志

- 2026-10-17 积压改动全部提交；备好洗过商户号的 publish 分支；卡在等用户建 GitHub 空仓
- 2026-09-15 建立 STATUS.md
- 2026-08-07 英语绘本上线
- 2026-08-06 回退 v0.1
