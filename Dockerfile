# =========================
# 1. Base image
# =========================
FROM node:20-alpine AS base

# Install pnpm globally via npm so it's available in all subsequent stages
RUN npm install -g pnpm@9

# =========================
# 2. Dependencies
# =========================
FROM base AS deps

WORKDIR /app

# Copy manifests and workspace config
COPY package.json pnpm-lock.yaml ./

# Install production + dev deps (needed for build)
RUN pnpm install --frozen-lockfile

# =========================
# 3. Builder
# =========================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx next build

# =========================
# 4. Runner (production)
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces inside the container
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy standalone output (next.config.mjs has output: "standalone")
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
