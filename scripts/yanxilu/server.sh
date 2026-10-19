#!/usr/bin/env bash
# 研习录并入 Baba：服务器（dmit2）上的那一半。由 scripts/deploy-yanxilu.sh 传上来、在后台跑，不要手动直接跑。
#   用法：bash server.sh <上传目录> <模式>        模式 = check（只检查，不改任何东西）| deploy
#   上传目录里有：new/（分支 yanxilu 的 src、next.config.mjs、prisma/schema.prisma）
#               base/（main 分支同样几样，用来确认服务器上的代码没有 GitHub 上没有的改动）
#               yanxilu/（这个目录：server.sh、schema.sql）
#
# 按交接简报（brain/2-Areas/运维/服务器交接_dmit2.md）的铁律：
#   - 先清 docker 构建缓存腾盘；构建前停掉 ai-studio 两个容器腾内存，结束时 docker start 回来
#     （不用 docker compose up，免得重建容器丢掉宿主端口映射）
#   - 只换 src/、next.config.mjs、prisma/schema.prisma；不碰 data/、.env、node_modules、已有迁移
#   - 表结构走幂等 SQL + psql，不用 prisma db push / migrate deploy
#   - 构建失败不重启进程；源码和 .next 自动还原
#   - 只在 baba.wogucloud.cn 的 server 块里加 client_max_body_size，不动 80/443 的监听
set -uo pipefail
D=${1:?上传目录}
MODE=${2:-check}
APP=/opt/baba-english
YXL=/opt/yanxilu
FILES=/opt/yanxilu-files
TAG=$(basename "$D")
BK=/opt/baba-english.bak-yxl-$TAG
PG=baba-pg
STUDIO=(ai-studio-app-1 ai-studio-db-1)   # 先停 app 再停 db；起回来时反过来
STOPPED=()
RESTARTED=0
CHANGED=0

step() { printf '\n== %s  [%s]\n' "$*" "$(date +%H:%M:%S)"; }
done_rc() { echo; echo "==DONE rc=$1"; exit "$1"; }

studio_back() {
  if [ ${#STOPPED[@]} -gt 0 ]; then
    step "把 ai-studio 起回来（docker start，不重建容器）"
    for c in "${STOPPED[@]}"; do
      docker start "$c" >/dev/null && echo "  已启动 $c"
      [ "$c" = ai-studio-db-1 ] && sleep 6
    done
    STOPPED=()
    for i in $(seq 1 30); do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3002/ || true)
      [ "$code" = 200 ] && break
      sleep 4
    done
    echo "  studio 本机 3002：${code:-无响应}"
  fi
}
trap studio_back EXIT

rollback() {
  echo "!! $*"
  if [ "$CHANGED" = 1 ]; then
    step "还原到部署前"
    rm -rf "$APP/src" && cp -a "$BK/src" "$APP/src"
    cp -a "$BK/next.config.mjs" "$APP/next.config.mjs"
    cp -a "$BK/schema.prisma" "$APP/prisma/schema.prisma"
    (cd "$APP" && npx prisma generate >/dev/null 2>&1) && echo "  prisma 客户端已按旧表结构重新生成"
    if [ -d "$APP/.next.bak-yxl" ]; then rm -rf "$APP/.next" && cp -a "$APP/.next.bak-yxl" "$APP/.next" && echo "  .next 已还原"; fi
    if [ "$RESTARTED" = 1 ]; then pm2 restart baba-english >/dev/null && echo "  已用旧版本重启 baba-english"; fi
    echo "  源码备份留在 $BK；新建的两张表留着不影响旧版本"
  fi
  done_rc 1
}

# ---------------------------------------------------------------- 检查
step "检查"
echo "  主机：$(hostname)"
case "$(hostname)" in DMIT-*) ;; *) echo "!! 主机名不对，停下"; done_rc 1;; esac
[ -d "$APP/src/app" ] && [ -f "$APP/.env" ] && [ -d "$APP/node_modules" ] || { echo "!! $APP 不完整，停下"; done_rc 1; }
for f in "$D/new/src/app/route.ts" "$D/new/src/app/english/page.tsx" "$D/new/prisma/schema.prisma" "$D/new/next.config.mjs" "$D/yanxilu/schema.sql"; do
  [ -f "$f" ] || { echo "!! 上传的文件不全：$f"; done_rc 1; }
done
pm2 describe baba-english >/dev/null 2>&1 || { echo "!! pm2 里没有 baba-english，停下"; done_rc 1; }
docker ps --format '  容器 {{.Names}}  {{.Status}}'
pm2 list 2>/dev/null | grep -E 'baba-english' | sed 's/^/  /'
df -h / | tail -1 | awk '{print "  磁盘：已用 "$5"，剩 "$4}'
free -m | awk '/Mem:/{print "  内存：可用 "$7" MB"} /Swap:/{print "  swap：已用 "$3" / "$2" MB"}'
command -v git >/dev/null && echo "  git：$(git --version)" || echo "  git：没有（研习录要靠 git 拉取，下面会停）"
NGX=$(readlink -f /etc/nginx/sites-enabled/baba-english 2>/dev/null || true)
echo "  nginx 配置：${NGX:-没找到}"
[ -n "$NGX" ] && grep -n 'server_name\|listen\|client_max_body_size' "$NGX" | sed 's/^/    /'

echo
echo "  服务器上的代码和 GitHub main 比（不一样就说明服务器上有没推上去的改动，不能直接覆盖）："
DIFF=$(diff -rq "$APP/src" "$D/base/src" 2>&1; diff -q "$APP/next.config.mjs" "$D/base/next.config.mjs" 2>&1; diff -q "$APP/prisma/schema.prisma" "$D/base/prisma/schema.prisma" 2>&1)
if [ -n "$DIFF" ]; then
  echo "$DIFF" | sed 's/^/    /' | head -40
  [ "${FORCE:-0}" = 1 ] || { echo "!! 有差异。看清楚以后，确定可以覆盖再加 FORCE=1 重跑"; done_rc 1; }
  echo "  FORCE=1：照样覆盖（旧文件在备份里）"
else
  echo "    一致"
fi

if [ "$MODE" != deploy ]; then
  echo
  echo "  只检查，没有改动任何东西。"
  done_rc 0
fi
command -v git >/dev/null || { echo "!! 没有 git"; done_rc 1; }

# ---------------------------------------------------------------- 腾盘
step "清 docker 构建缓存和悬空镜像（铁律 2）"
docker builder prune -af 2>&1 | tail -1 | sed 's/^/  /'
docker image prune -f 2>&1 | tail -1 | sed 's/^/  /'
df -h / | tail -1 | awk '{print "  磁盘：已用 "$5"，剩 "$4}'
avail=$(df --output=avail -k / | tail -1)
[ "$avail" -gt 2000000 ] || { echo "!! 剩余空间不到 2 GB，停下"; done_rc 1; }

# ---------------------------------------------------------------- 研习录的页面
step "研习录的页面：$YXL（定时 git pull）"
if [ -d "$YXL/.git" ]; then
  git -C "$YXL" pull -q --ff-only && echo "  已更新到 $(git -C "$YXL" log -1 --format='%h %s')"
else
  git clone -q --depth 1 https://github.com/cnyanghai/yanxilu.git "$YXL" && echo "  已克隆 $(git -C "$YXL" log -1 --format='%h %s')"
fi
[ -f "$YXL/server/index.html" ] || { echo "!! 没拿到 $YXL/server/index.html，停下（还没改任何应用文件）"; done_rc 1; }
if ! crontab -l 2>/dev/null | grep -q '/opt/yanxilu && git pull'; then
  (crontab -l 2>/dev/null; echo '*/5 * * * * cd /opt/yanxilu && git pull -q --ff-only >/dev/null 2>&1') | crontab -
  echo "  已加定时任务：每 5 分钟 git pull"
else
  echo "  定时任务已经有了"
fi
mkdir -p "$FILES" && chmod 700 "$FILES" && echo "  电子书目录 $FILES 就绪"

# ---------------------------------------------------------------- 数据库
step "数据库：新建 YxlDoc、YxlFile（幂等 SQL）"
docker exec -i "$PG" psql -q -U baba -d baba_english -v ON_ERROR_STOP=1 < "$D/yanxilu/schema.sql" 2>&1 | grep -v NOTICE | sed 's/^/  /'
[ "${PIPESTATUS[0]}" = 0 ] || { echo "!! 建表失败，停下（还没改任何应用文件）"; done_rc 1; }
docker exec "$PG" psql -At -U baba -d baba_english -c "SELECT string_agg(tablename, ', ') FROM pg_tables WHERE tablename IN ('YxlDoc','YxlFile')" | sed 's/^/  表：/'

# ---------------------------------------------------------------- 换代码
step "备份并换代码"
rm -rf "$BK" && mkdir -p "$BK"
cp -a "$APP/src" "$BK/src" && cp -a "$APP/next.config.mjs" "$BK/" && cp -a "$APP/prisma/schema.prisma" "$BK/" || { echo "!! 备份失败"; done_rc 1; }
echo "  备份：$BK"
CHANGED=1
cp -a "$D/new/src/." "$APP/src/"
rm -f "$APP/src/app/page.tsx"   # 原首页挪到了 src/app/english/page.tsx，和新的 src/app/route.ts 不能并存
cp -a "$D/new/next.config.mjs" "$APP/next.config.mjs"
cp -a "$D/new/prisma/schema.prisma" "$APP/prisma/schema.prisma"
echo "  已换上分支 yanxilu 的 src、next.config.mjs、schema.prisma"
if ! (cd "$APP" && npx prisma generate 2>&1 | tail -2 | sed 's/^/  /'; exit "${PIPESTATUS[0]}"); then rollback "prisma generate 失败"; fi

# ---------------------------------------------------------------- 构建
step "腾内存：停 ai-studio 两个容器（铁律 1）"
for c in "${STUDIO[@]}"; do
  if [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = true ]; then
    docker stop "$c" >/dev/null && STOPPED=("$c" "${STOPPED[@]}") && echo "  已停 $c"
  fi
done
# STOPPED 里 db 排在 app 前面（后停的插到最前），起回来时先起 db
free -m | awk '/Mem:/{print "  内存：可用 "$7" MB"}'

step "备份 .next"
rm -rf "$APP/.next.bak-yxl"
if [ -d "$APP/.next" ]; then
  mkdir -p "$APP/.next.bak-yxl" && (cd "$APP/.next" && tar cf - --exclude=./cache .) | (cd "$APP/.next.bak-yxl" && tar xf -) && echo "  .next 已备份（不含 cache）"
fi

step "构建（next build）"
if ! (cd "$APP" && NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | grep -vE '^\s*$' | tail -40 | sed 's/^/  /'; exit "${PIPESTATUS[0]}"); then
  rollback "构建失败，进程不重启，旧版本继续服务"
fi

step "重启 baba-english"
pm2 restart baba-english >/dev/null && RESTARTED=1 && echo "  已重启"
ok=""
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:3001/english || true)
  [ "$code" = 200 ] && ok=1 && break
  sleep 3
done
[ -n "$ok" ] || rollback "重启后 /english 不是 200（最后一次：${code:-无响应}）"
pm2 save >/dev/null 2>&1 || true

studio_back

# ---------------------------------------------------------------- nginx
step "nginx：baba 的 server 块里允许最大 50 MB 上传"
if [ -n "$NGX" ] && ! grep -q 'client_max_body_size' "$NGX"; then
  cp -a "$NGX" "/root/nginx-baba-english.bak-$TAG"
  sed -i --follow-symlinks '/server_name[^;]*baba\.wogucloud\.cn[^;]*;/a\    client_max_body_size 50m;' "$NGX"
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx && echo "  已加上并 reload（原文件备份在 /root/nginx-baba-english.bak-$TAG）"
  else
    cp -a "/root/nginx-baba-english.bak-$TAG" "$NGX"
    echo "  !! nginx -t 不通过，已还原原文件；电子书大于 1 MB 会传不上去，需要手动看一下"
  fi
else
  echo "  ${NGX:+已经有 client_max_body_size，不动}${NGX:-没找到配置文件，跳过}"
fi

# ---------------------------------------------------------------- 验证
step "验证"
for u in / /english /api/yxl/english /vendor/pdfjs/pdf.mjs "/reports/wealth.html"; do
  printf '  %-28s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:3001$u")"
done
curl -s --max-time 10 http://127.0.0.1:3001/ | grep -q 'YXL_SERVER' && echo "  首页是研习录服务器版 ✓" || echo "  !! 首页内容不像研习录"
printf '  %-28s %s\n' "studio 本机 3002" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3002/)"
df -h / | tail -1 | awk '{print "  磁盘：已用 "$5"，剩 "$4}'
free -m | awk '/Mem:/{print "  内存：可用 "$7" MB"}'
docker ps --format '  容器 {{.Names}}  {{.Status}}'
pm2 list 2>/dev/null | grep -E 'baba-english' | sed 's/^/  /'
echo "  回退：源码 $BK，构建 $APP/.next.bak-yxl"
done_rc 0
