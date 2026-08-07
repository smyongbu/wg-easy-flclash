#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo '未找到 Docker，请先安装 Docker。' >&2
  exit 1
fi

if docker inspect wg-easy >/dev/null 2>&1; then
  echo '检测到名为 wg-easy 的现有容器。为避免覆盖密钥，本脚本已停止。' >&2
  echo '请先按照 README 的“迁移现有安装”章节备份并迁移数据。' >&2
  exit 1
fi

mkdir -p runtime
chmod 700 runtime

if [ ! -f .env ]; then
  cp .env.example .env
  echo '已根据 .env.example 创建 .env；如网段不同，请安装后修改 FLCLASH_REMOTE_CIDRS 并重启容器。'
fi

if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --build
else
  echo '未找到 Docker Compose。' >&2
  exit 1
fi

echo '安装完成：请打开 http://路由器IP:51821/ 完成首次设置。'
