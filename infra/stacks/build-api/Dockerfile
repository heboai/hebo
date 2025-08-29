# syntax=docker/dockerfile:1

########################  deps stage  ########################
FROM oven/bun:1.2.18 AS deps

WORKDIR /repo

COPY bun.lock bunfig.toml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json

RUN bun install --filter '@hebo/api' --frozen-lockfile --production

########################  builder stage  ########################
FROM oven/bun:1.2.18 AS builder

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules

COPY . .

WORKDIR /repo/apps/api

RUN bun run build

########################  runner stage  ########################
FROM oven/bun:1.2.18 AS runner

ENV NODE_ENV=production

RUN adduser --system --ingroup bun appuser

WORKDIR /repo

COPY --chown=appuser:bun --from=builder /repo/apps/api/dist ./apps/api/dist

USER appuser

WORKDIR /repo/apps/api

EXPOSE 3001

CMD ["./dist/server"] 