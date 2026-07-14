FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat wget

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build --filter=@conversation-platform/api

FROM base AS production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

USER appuser
EXPOSE 3001
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

LABEL org.opencontainers.image.title="Conversation Platform API" \
  org.opencontainers.image.description="Multi-tenant WhatsApp conversation platform API" \
  org.opencontainers.image.version="${VERSION:-latest}" \
  org.opencontainers.image.created="${BUILD_DATE:-}" \
  org.opencontainers.image.source="https://github.com/anomalyco/conversation-platform" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.authors="Platform Team"

CMD ["node", "dist/index.js"]
