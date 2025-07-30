# syntax=docker/dockerfile:1

########################  deps stage  ########################
FROM oven/bun:1.2.18 AS deps

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Copy other package manifests that api depends on (db + itself)
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY infra/package.json infra/package.json

RUN bun install --filter '@hebo/api' --frozen-lockfile --production

########################  runner stage  ########################
FROM oven/bun:1.2.18 AS runner

# Create an unprivileged user
RUN adduser --system --ingroup bun appuser

WORKDIR /repo

COPY --chown=appuser:bun --from=deps /repo/node_modules ./node_modules

COPY --chown=appuser:bun . .

USER appuser

WORKDIR /repo/apps/api

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"] 