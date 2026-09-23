#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  $0 \
    --release-dir <path> \
    --region <aws-region> \
    --web-image <ecr-uri:tag> \
    --release-tag <tag>
USAGE
}

RELEASE_DIR=""
AWS_REGION=""
WEB_IMAGE=""
RELEASE_TAG=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --release-dir) RELEASE_DIR="$2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --web-image) WEB_IMAGE="$2"; shift 2 ;;
    --release-tag) RELEASE_TAG="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

for cmd in aws docker; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing command: $cmd" >&2; exit 1; }
done

run_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
    return
  fi

  echo "Missing compose runtime (tried 'docker compose' and 'docker-compose')" >&2
  exit 1
}

[ -n "$RELEASE_DIR" ] || { echo "Missing --release-dir" >&2; exit 1; }
[ -n "$AWS_REGION" ] || { echo "Missing --region" >&2; exit 1; }
[ -n "$WEB_IMAGE" ] || { echo "Missing --web-image" >&2; exit 1; }
[ -n "$RELEASE_TAG" ] || { echo "Missing --release-tag" >&2; exit 1; }
[ -d "$RELEASE_DIR" ] || { echo "Release dir not found: $RELEASE_DIR" >&2; exit 1; }

cd "$RELEASE_DIR"

APP_BASE_ENV_FILE="docker/.env.app.prod"
APP_ENV_FILE="$(mktemp /tmp/sity-app-env.XXXXXX)"
trap 'rm -f "$APP_ENV_FILE"' EXIT

[ -f "$APP_BASE_ENV_FILE" ] || { echo "Missing base env file in bundle: $APP_BASE_ENV_FILE" >&2; exit 1; }
cp "$APP_BASE_ENV_FILE" "$APP_ENV_FILE"
chmod 600 "$APP_ENV_FILE"

read_env_var() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | tail -n1 | cut -d'=' -f2- || true
}

require_env_var_in_file() {
  local file="$1"
  local key="$2"
  local value
  value="$(read_env_var "$file" "$key")"
  if [ -z "$value" ]; then
    echo "Missing required non-secret value '$key' in $file" >&2
    exit 1
  fi
}

upsert_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" -F= '
    BEGIN { updated=0 }
    $1 == key { print key "=" value; updated=1; next }
    { print }
    END { if (!updated) print key "=" value }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

required_non_secret_keys=(
  LOG_LEVEL
)

for key in "${required_non_secret_keys[@]}"; do
  require_env_var_in_file "$APP_ENV_FILE" "$key"
done

upsert_env_var "$APP_ENV_FILE" "WEB_IMAGE" "$WEB_IMAGE"
upsert_env_var "$APP_ENV_FILE" "APP_RELEASE" "$RELEASE_TAG"

docker network create "platform_ops_shared" >/dev/null 2>&1 || true

is_ecr_registry() {
  local registry="$1"
  [[ "$registry" == *".dkr.ecr."*".amazonaws.com"* ]]
}

login_ecr_for_image() {
  local image="$1"
  local registry
  local registry_region

  registry="${image%%/*}"

  if [ -z "$registry" ] || [ "$registry" = "$image" ]; then
    return 0
  fi

  if ! is_ecr_registry "$registry"; then
    return 0
  fi

  registry_region="$(printf '%s' "$registry" | awk -F'.' '{print $4}')"
  if [ -z "$registry_region" ]; then
    registry_region="$AWS_REGION"
  fi

  echo "[deploy] Logging into ECR registry: $registry (region=$registry_region)"
  aws ecr get-login-password --region "$registry_region" | docker login --username AWS --password-stdin "$registry" >/dev/null
}

login_ecr_for_image "$WEB_IMAGE"

run_compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml up -d --remove-orphans

web_ready=false
for _ in $(seq 1 60); do
  if run_compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml exec -T \
    sity_web wget -qO- http://127.0.0.1:8080/health >/dev/null 2>&1; then
    web_ready=true
    break
  fi
  sleep 2
done

if [ "$web_ready" != "true" ]; then
  echo "sity web did not become ready after deployment." >&2
  run_compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml ps >&2 || true
  run_compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml logs --no-color sity_web >&2 || true
  exit 1
fi

run_compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml ps
echo "[deploy] sity web is ready."
