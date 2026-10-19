# 研习录搬进 Baba（2026-10-19）

网站首页 `/` 换成研习录（个人学习站，仓库 github.com/cnyanghai/yanxilu），Baba 原来的首页挪到 `/english`。
Baba 的「看剧逐句学」「生词本和复习」「学习进度」成了研习录书架上「英语」那一层的功能：
片盒的进度条、在学 / 学完由 Baba 的观看进度算出来；点「接着学」在研习录上的浮层里打开 Baba 的逐句学页面，接着上次那一句。

## 改了什么

| 位置 | 内容 |
| --- | --- |
| `prisma/schema.prisma` | 新表 `YxlDoc`（研习录的记录：进度、批注、足迹、阅读进度、划线……按账号存 JSON）、`YxlFile`（研习录书架上挂的电子书） |
| `src/lib/yxl.ts` | 认人（Baba 登录会话；可选的定时任务令牌）、记录类别白名单、文件目录、读研习录静态文件 |
| `src/app/api/yxl/state` | `GET` 当前账号的全部记录 |
| `src/app/api/yxl/doc` | `GET / PUT / DELETE` 一条记录 |
| `src/app/api/yxl/docs` | `POST` 整批导入（claude.ai 版导出的记录文件） |
| `src/app/api/yxl/files`、`files/[id]` | 电子书上传、读取、删除（文件在 `YXL_FILES_DIR/<userId>/<id>`，只有本人能读） |
| `src/app/api/yxl/english` | 书架「英语」一层要的数据：片单、每集句数、看到哪一句、累计时长、生词本各状态数量 |
| `src/app/route.ts` | 首页 = `YXL_DIR/server/index.html` |
| `src/app/vendor/[...path]`、`src/app/reports/[...path]` | 研习录的 PDF.js 和专题页，从 `YXL_DIR` 现读 |
| `next.config.mjs` | `/_blob/:id` 转到 `/api/yxl/files/:id`（研习录页面里电子书的地址） |
| `src/app/english/page.tsx` | 原首页（`src/app/page.tsx` 挪过来）；各处「回首页」改指 `/english` |
| `src/app/layout.tsx`、`globals.css` | 在研习录的浮层（iframe）里打开时藏掉 Baba 顶栏；浮层里指回 `/` 的链接整页打开 |
| `src/components/Header.tsx` | 顶栏加「研习录」入口；Logo 指 `/english` |

研习录的页面不在这个仓库里：服务器上另放一份 yanxilu 仓库的克隆，cron 定时 `git pull`，Baba 每次请求现读，所以研习录更新不用重新部署 Baba。

## 部署（dmit2）

按《服务器交接简报：dmit2》的规矩写成了脚本：服务器上的 `/opt/baba-english` 不是 git 仓库，代码从本地传上去；
1.9 G 内存，构建前要停掉 ai-studio；表结构走幂等 SQL，不用 `prisma db push` / `migrate deploy`。

在 WSL 里（用 `~/.ssh/config` 里已经配好的 `dmit2`）：

```bash
cd ~/brain/1-Projects/baba-english
git fetch origin +refs/heads/yanxilu:refs/remotes/origin/yanxilu
git show origin/yanxilu:scripts/deploy-yanxilu.sh > /tmp/deploy-yanxilu.sh
bash /tmp/deploy-yanxilu.sh check     # 先只检查，不改任何东西
bash /tmp/deploy-yanxilu.sh deploy    # 再部署
```

`deploy-yanxilu.sh` 只在本地取代码（分支 yanxilu 和 main，用 `git archive`，不动工作区），打包传到服务器 `/opt/yxl-deploy/<时间>/`，
然后在服务器上后台跑 `scripts/yanxilu/server.sh`，本地看日志。全程复用一条 ssh 连接（服务器有 fail2ban，不连续重试）。

`server.sh` 依次做：

1. **检查**：主机名、pm2 里有 baba-english、磁盘内存、nginx 配置；把服务器上的 `src/`、`next.config.mjs`、`schema.prisma` 和 GitHub main 比，
   有差异（服务器上有没推上去的改动）就停下，确认后用 `FORCE=1` 重跑才覆盖。`check` 模式到这里就结束。
2. `docker builder prune -af && docker image prune -f` 腾盘，剩余不到 2 GB 就停。
3. 克隆研习录到 `/opt/yanxilu`，crontab 加每 5 分钟 `git pull`；建 `/opt/yanxilu-files`（电子书）。
4. `docker exec -i baba-pg psql` 跑 `scripts/yanxilu/schema.sql`（只新建 YxlDoc、YxlFile，可重复执行）。
5. 备份 `src/`、`next.config.mjs`、`schema.prisma` 到 `/opt/baba-english.bak-yxl-<时间>/`，换上新代码，删掉挪走的 `src/app/page.tsx`，`npx prisma generate`。
6. 停 `ai-studio-app-1`、`ai-studio-db-1` 腾内存，备份 `.next`，`npm run build`。
   失败：源码和 `.next` 还原，**不重启进程**，旧版本继续服务。
7. `pm2 restart baba-english`，等 `/english` 返回 200；不是 200 就整套还原再重启旧版本。
8. `docker start` 把 ai-studio 两个容器起回来（不用 compose，免得重建容器丢端口映射）。
9. 只在 `server_name baba.wogucloud.cn` 的 server 块里加 `client_max_body_size 50m;`，`nginx -t` 通过才 reload，不通过就还原（不动 80/443 的监听）。
10. 验证：本机 3001 的 `/`、`/english`、`/api/yxl/english`、`/vendor/...`、`/reports/...`，studio 3002，磁盘、内存、容器、pm2。

`.env` 不用改：`YXL_DIR`、`YXL_FILES_DIR` 默认就是 `/opt/yanxilu`、`/opt/yanxilu-files`。依赖没变，不用 `npm install`。

**回退**：`/opt/baba-english.bak-yxl-<时间>/` 里是旧的 `src/`、`next.config.mjs`、`schema.prisma`，`/opt/baba-english/.next.bak-yxl` 是旧的构建产物；
拷回去、`npx prisma generate`、`pm2 restart baba-english` 即可。新建的两张表留着不影响旧版本。

**以后照旧的部署流程（rsync src/ 上去）要注意**：本地源码先切到包含这次改动的版本（PR 合并后的 main），
否则 rsync 不带 `--delete` 时服务器上会同时留着 `src/app/route.ts` 和本地旧的 `src/app/page.tsx`，构建会因为 `/` 冲突失败。

可选：家里的账号开会员（不受每集 10 分钟试看限制）：

```bash
ssh dmit2 "docker exec baba-pg psql -U baba -d baba_english -c \"UPDATE \\\"User\\\" SET \\\"paidUntil\\\" = '2099-12-31' WHERE phone = '<手机号>';\""
```

## 部署后检查

1. 打开 https://baba.wogucloud.cn ：出来的是研习录，右上角是「登录」。
2. 登录（Baba 的手机号账号）→ 回到研习录，右上角变成账号名。
3. 新账号会提示「导入记录文件」：选 claude.ai 版导出的 JSON，导入后书架、足迹里的记录就在了。
4. 书架 → 英语：点老友记，展台上有学到第几句；「接着学」打开浮层；关掉浮层进度会刷新。
5. 给一本书挂 PDF，点「开始读」能打开。
6. https://baba.wogucloud.cn/english 是原来的 Baba 首页。

## 备份

除了 Postgres（`baba-pg`），`/opt/yanxilu-files`（电子书文件）也要一起备份。

## 可选：定时任务直接写进来

`YXL_AGENT_TOKEN`（至少 24 位随机串）和 `YXL_AGENT_PHONE`（用哪个账号）都设了以后，带 `Authorization: Bearer <令牌>` 的请求按那个账号读写 `/api/yxl/*`。
现在用不到：每日讲义和打卡进度是随研习录仓库更新的（`git pull` 以后首页就是新的）。两个变量不设，这条路就是关的。
