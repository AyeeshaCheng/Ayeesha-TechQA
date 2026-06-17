# ── Build stage ──
FROM --platform=linux/arm64 node:22-alpine AS builder

# Native addon build tools (for better-sqlite3 C++ compilation)
RUN apk add --no-cache python3 make g++ py3-setuptools

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ── Production stage ──
FROM --platform=linux/arm64 node:22-alpine AS runner

# Chromium + runtime deps for PDF generation + CJK fonts for Chinese text
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    wget

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Ensure data directories exist
RUN mkdir -p /app/data /app/data/jd-images /app/data/resumes /app/data/exports && \
    mkdir -p /app/public

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
