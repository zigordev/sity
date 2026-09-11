#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker/compose.app.local.yml down "$@"
