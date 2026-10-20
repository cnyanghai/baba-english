#!/usr/bin/env bash
# 部署 Baba（含研习录的接口）到 dmit2。在 WSL 里跑，用 ~/.ssh/config 里已经配好的 dmit2。
# 默认部署 GitHub 上的 main；BRANCH=xxx 可以部署别的分支。
# 服务器上的代码和 GitHub 不完全一样（wxpay.ts 的注释、next.config.mjs、schema.prisma 有服务器自己的内容），
# 所以不整份覆盖：取“服务器上现在的版本 → 这次的版本”的改动，当补丁打到服务器现有的文件上。
#
#   bash deploy-yanxilu.sh check     只检查（服务器状态、代码有没有分叉），不改任何东西
#   bash deploy-yanxilu.sh deploy    部署
#
# 本地只做两件事：从 GitHub 取代码（分支 yanxilu 和 main），传到服务器的 /opt/yxl-deploy/<时间>/；
# 真正的部署在服务器上后台跑（scripts/yanxilu/server.sh），所以 ssh 断了也不会半途而废。
# 全程复用一条 ssh 连接，不连续重试（服务器有 fail2ban）。
set -euo pipefail
MODE=${1:-check}
case "$MODE" in check|deploy) ;; *) echo "用法：bash $0 check|deploy"; exit 2;; esac
HOST=${DEPLOY_HOST:-dmit2}
BRANCH=${BRANCH:-main}
REPO=https://github.com/cnyanghai/baba-english.git
LOCAL=${LOCAL:-$HOME/brain/1-Projects/baba-english}
TAG=$(date +%Y%m%d-%H%M%S)
LOG=$HOME/baba-deploy-$TAG.log
exec > >(tee -a "$LOG") 2>&1
echo "部署 Baba · $MODE · $TAG（日志 $LOG）"

CM=/tmp/ssh-dmit2-yxl-$$
SSHO=(-o ControlMaster=auto -o ControlPath="$CM" -o ControlPersist=20m -o ServerAliveInterval=20 -o ConnectTimeout=25 -o BatchMode=yes)
WORK=$(mktemp -d /tmp/baba-yxl.XXXX)
cleanup() { ssh -o ControlPath="$CM" -O exit "$HOST" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

# ---- 1. 取代码：优先用本地仓库 fetch（不动你的工作区），不行再从 GitHub 克隆
echo; echo "== 取代码"
mkdir -p "$WORK/up/new" "$WORK/up/base"
if git -C "$LOCAL" rev-parse --git-dir >/dev/null 2>&1 && git -C "$LOCAL" fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" "+refs/heads/main:refs/remotes/origin/main" 2>/dev/null; then
  SRC=$LOCAL
else
  echo "  本地仓库 $LOCAL 取不到，改从 GitHub 克隆"
  git clone -q --no-checkout "$REPO" "$WORK/repo"
  git -C "$WORK/repo" fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  SRC=$WORK/repo
fi
NEW=$(git -C "$SRC" rev-parse "origin/$BRANCH")
echo "  要部署的：$BRANCH $(git -C "$SRC" log -1 --format='%h %s' "$NEW")"

# ---- 2. 连上服务器（只连一次，后面都复用这条连接）
echo; echo "== 连接 $HOST"
if ! ssh "${SSHO[@]}" "$HOST" 'echo "  已连上 $(hostname)"'; then
  echo "!! ssh 连不上。不要马上重试（fail2ban）：等 10 分钟再跑，或者先看交接简报里的代理说明。"; exit 1
fi
# 服务器上现在跑的是哪个提交（每次部署成功写在 /opt/baba-english/.yxl-deployed）。
# 第一次部署研习录（2026-10-19）之前没有这个记录，那次部署的是 91be47b。
BASE=$(ssh "${SSHO[@]}" "$HOST" 'cat /opt/baba-english/.yxl-deployed 2>/dev/null' | tr -d '[:space:]')
[ -n "$BASE" ] || BASE=$(git -C "$SRC" rev-parse 91be47b)
git -C "$SRC" cat-file -e "$BASE^{commit}" 2>/dev/null || { echo "!! 本地仓库里找不到服务器上的版本 $BASE，先 git fetch 一下"; exit 1; }
echo "  服务器上现在是：$(git -C "$SRC" log -1 --format='%h %s' "$BASE")"
if [ "$BASE" != "$NEW" ] && ! git -C "$SRC" diff --quiet "$BASE" "$NEW" -- prisma/schema.prisma; then
  echo "!! 这次改了 prisma/schema.prisma。服务器上的 schema 和 GitHub 不一样，不能直接覆盖：先写好幂等 SQL 和对应的改法再部署。"; exit 1
fi
git -C "$SRC" archive "$NEW" src next.config.mjs prisma/schema.prisma scripts/yanxilu | tar -x -C "$WORK/up/new"
git -C "$SRC" archive "$BASE" src next.config.mjs prisma/schema.prisma | tar -x -C "$WORK/up/base"
mv "$WORK/up/new/scripts/yanxilu" "$WORK/up/yanxilu"; rm -rf "$WORK/up/new/scripts"
git -C "$SRC" diff --no-renames --no-color --no-ext-diff "$BASE" "$NEW" -- src next.config.mjs > "$WORK/up/yanxilu.patch"
echo "$NEW" > "$WORK/up/new.sha"; echo "$BASE" > "$WORK/up/base.sha"
echo "  这次的改动：$(git -C "$SRC" diff --stat "$BASE" "$NEW" -- src next.config.mjs | tail -1)"
R=/opt/yxl-deploy/$TAG
tar -C "$WORK/up" -czf - . | ssh "${SSHO[@]}" "$HOST" "mkdir -p $R && tar -xzf - -C $R"
echo "  已上传到 $R"

# ---- 3. 服务器上后台跑，这边看日志
echo; echo "== 服务器上执行（$MODE）"
ssh "${SSHO[@]}" "$HOST" "cd $R && setsid nohup bash yanxilu/server.sh $R $MODE > $R/server.log 2>&1 < /dev/null & echo '  已在后台开始'"
n=0; rc=""
while :; do
  sleep 8
  out=$(ssh "${SSHO[@]}" "$HOST" "tail -n +$((n + 1)) $R/server.log" 2>/dev/null) || { echo "  （这一轮没取到日志，接着等）"; continue; }
  if [ -n "$out" ]; then
    printf '%s\n' "$out"
    n=$((n + $(printf '%s\n' "$out" | wc -l)))
    rc=$(printf '%s\n' "$out" | sed -n 's/^==DONE rc=\([0-9]*\)$/\1/p' | tail -1)
    [ -n "$rc" ] && break
  fi
done

# ---- 4. 从外面再看一眼
if [ "$MODE" = deploy ] && [ "$rc" = 0 ]; then
  echo; echo "== 从外网访问"
  for u in https://baba.wogucloud.cn/ https://baba.wogucloud.cn/english https://studio.wogucloud.cn/; do
    printf '  %-36s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$u" || echo 无响应)"
  done
fi
echo
[ "$rc" = 0 ] && echo "完成（$MODE）。日志：$LOG" || echo "没有完成，看上面 !! 开头的那几行。日志：$LOG"
exit "${rc:-1}"
