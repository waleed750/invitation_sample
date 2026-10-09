# Web image for the non-Coolify reference stack (platform/infra/docker-compose.prod.yml).
# Build context MUST be `platform/` (the npm-workspaces root):
#   docker build -f infra/web/Dockerfile -t platform-web ..
# Coolify users do NOT need this file (Coolify builds from source via Nixpacks).
#
# NOTE: this image was not built here (no Docker in this environment).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* vars are baked at build time — set them in .env.prod before building.
RUN npm run build --workspace @platform/shared && npm run build --workspace @platform/web

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "-p", "3000", "--dir", "apps/web"]
