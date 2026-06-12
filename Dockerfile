FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./

ENV HUSKY=0

RUN bun install --frozen-lockfile

FROM oven/bun:1 AS embeddings

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends unzip \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY scripts/build-clueless-embeddings.ts ./scripts/
RUN mkdir -p src/games/clueless/data
COPY src/games/clueless/data/ ./src/games/clueless/data/
RUN bun run build:embeddings

FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=embeddings /app/src/games/clueless/data/embeddings.bin ./src/games/clueless/data/embeddings.bin

ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build:app

FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/games/clueless/data ./src/games/clueless/data

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
