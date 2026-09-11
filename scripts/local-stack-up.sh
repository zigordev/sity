#!/usr/bin/env bash
set -euo pipefail

SHARED_NETWORK="platform_ops_shared"

docker network create "$SHARED_NETWORK" >/dev/null 2>&1 || true

docker compose -f docker/compose.app.local.yml up -d --build --force-recreate --remove-orphans

echo "sity web started on http://localhost:3031"
