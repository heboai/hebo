# syntax=docker/dockerfile:1

########################  deps stage  ########################
FROM oven/bun:1.2.18 AS deps

WORKDIR /repo

COPY bun.lock bunfig.toml package.json ./
# Copy other package manifests that api depends on (db + itself)
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY infra/package.json infra/package.json

RUN bun install --filter '@hebo/api' --frozen-lockfile --production

########################  builder stage  ########################
FROM oven/bun:1.2.18 AS builder

WORKDIR /repo

# Copy dependencies from deps stage
COPY --from=deps /repo/node_modules ./node_modules

# Copy source code
COPY . .

WORKDIR /repo/apps/api

# Build the application
RUN bun run build

########################  runner stage  ########################
FROM oven/bun:1.2.18 AS runner

ENV NODE_ENV=production

# Create an unprivileged user
RUN adduser --system --ingroup bun appuser

WORKDIR /repo

# Copy only production dependencies from deps stage
COPY --chown=appuser:bun --from=deps /repo/node_modules ./node_modules

# Copy built application from builder stage
COPY --chown=appuser:bun --from=builder /repo/apps/api/dist ./apps/api/dist

USER appuser

WORKDIR /repo/apps/api

EXPOSE 3001

CMD ["bun", "run", "dist/index.js"] 