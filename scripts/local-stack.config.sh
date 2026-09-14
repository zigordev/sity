APP_LABEL="sity web"
COMPOSE_FILES=(docker/compose.app.local.yml)
DEV_COMPOSE_FILES=(docker/compose.app.dev.yml)

RESET_MODE="rebuild"
READY_MESSAGE="sity web started."
READY_URLS=("http://localhost:3031")
