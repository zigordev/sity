#!/usr/bin/env bash
set -euo pipefail

SHARED_NETWORK="platform_ops_shared"
LOCAL_STACK_MODE="${LOCAL_STACK_MODE:-local}"

compose=(docker compose -f docker/compose.app.local.yml)
if [ "$LOCAL_STACK_MODE" = "dev" ]; then
  compose+=(-f docker/compose.app.dev.yml)
fi

docker network create "$SHARED_NETWORK" >/dev/null 2>&1 || true

if [ "$LOCAL_STACK_MODE" = "dev" ]; then
  "${compose[@]}" up -d --build --force-recreate --remove-orphans
  echo "sity web (dev) started on http://localhost:3031"
  echo "watch mode: docker compose -f docker/compose.app.local.yml -f docker/compose.app.dev.yml watch"
else
  "${compose[@]}" up -d --build --force-recreate --remove-orphans
  echo "sity web started on http://localhost:3031"
fi
