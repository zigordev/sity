#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker/compose.app.local.yml down --remove-orphans
docker compose -f docker/compose.app.local.yml build --no-cache
bash ./scripts/local-stack-up.sh
