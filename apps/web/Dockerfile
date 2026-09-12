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

FROM nginxinc/nginx-unprivileged:1.31-alpine AS prod
USER root
RUN apk upgrade --no-cache
USER nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 8080

FROM prod AS local

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
EXPOSE 8080
CMD ["npm", "exec", "--", "vite", "--host", "0.0.0.0", "--port", "8080"]
