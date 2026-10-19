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

## 部署（DMIT2）

```bash
# 1. 研习录的克隆 + 定时更新（公开仓库，不用凭证）
cd /opt && git clone https://github.com/cnyanghai/yanxilu.git yanxilu
( crontab -l 2>/dev/null; echo '*/5 * * * * cd /opt/yanxilu && git pull -q --ff-only' ) | crontab -

# 2. 电子书目录（给跑 pm2 的那个用户写权限）
mkdir -p /opt/yanxilu-files

# 3. /opt/baba-english/.env 里加两行
#    YXL_DIR=/opt/yanxilu
#    YXL_FILES_DIR=/opt/yanxilu-files

# 4. 更新 Baba（PR 合并后在 main 上；没合并也可以先 git checkout yanxilu）
cd /opt/baba-english
git pull
npm ci
npx prisma generate
npx prisma db push      # 只应该新建 YxlDoc、YxlFile 两张表；如果提示会丢数据，先停下来
npm run build
pm2 ls                  # 找到 Baba 的进程名
pm2 restart <进程名>

# 5. nginx：电子书最大 48 MB，默认 1 MB 会被挡
#    在 baba.wogucloud.cn 的 server { } 里加：client_max_body_size 50m;
nginx -t && systemctl reload nginx
```

可选：家里的账号开会员（不受每集 10 分钟试看限制）：

```bash
docker exec -it <pg 容器> psql -U <用户> -d <库> -c "UPDATE \"User\" SET \"paidUntil\" = '2099-12-31' WHERE phone = '<手机号>';"
```

## 部署后检查

1. 打开 https://baba.wogucloud.cn ：出来的是研习录，右上角是「登录」。
2. 登录（Baba 的手机号账号）→ 回到研习录，右上角变成账号名。
3. 新账号会提示「导入记录文件」：选 claude.ai 版导出的 JSON，导入后书架、足迹里的记录就在了。
4. 书架 → 英语：点老友记，展台上有学到第几句；「接着学」打开浮层；关掉浮层进度会刷新。
5. 给一本书挂 PDF，点「开始读」能打开。
6. https://baba.wogucloud.cn/english 是原来的 Baba 首页。

## 备份

除了 Postgres，`/opt/yanxilu-files`（电子书文件）也要一起备份。

## 可选：定时任务直接写进来

`YXL_AGENT_TOKEN`（至少 24 位随机串）和 `YXL_AGENT_PHONE`（用哪个账号）都设了以后，带 `Authorization: Bearer <令牌>` 的请求按那个账号读写 `/api/yxl/*`。
现在用不到：每日讲义和打卡进度是随研习录仓库更新的（`git pull` 以后首页就是新的）。两个变量不设，这条路就是关的。
