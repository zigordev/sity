FROM node:24-alpine AS base
WORKDIR /workspace

FROM base AS deps-build
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN set -eux; \
  for attempt in 1 2 3; do \
    HUSKY=0 npm ci --workspace @sity/web --include-workspace-root --ignore-scripts && break; \
    if [ "$attempt" -eq 3 ]; then \
      exit 1; \
    fi; \
    echo "npm ci failed (attempt $attempt), retrying in 10s..."; \
    sleep 10; \
  done

FROM base AS build
ENV NODE_ENV=production
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
RUN npm run build

FROM base AS deps-prod
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN set -eux; \
  for attempt in 1 2 3; do \
    HUSKY=0 npm ci --workspace @sity/web --include-workspace-root --omit=dev --ignore-scripts && break; \
    if [ "$attempt" -eq 3 ]; then \
      exit 1; \
    fi; \
    echo "npm ci failed (attempt $attempt), retrying in 10s..."; \
    sleep 10; \
  done

FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /opt/yarn-v1.22.22 \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps-prod /workspace/node_modules /app/node_modules
COPY apps/web/package.json /app/package.json
COPY --from=build /workspace/apps/web/dist /app/dist
COPY --from=build /workspace/apps/web/dist-server /app/dist-server
USER node
EXPOSE 8080
CMD ["node", "dist-server/main.js"]

FROM prod AS local

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
EXPOSE 8080
CMD ["npm", "exec", "--", "vite", "--host", "0.0.0.0", "--port", "8080"]
