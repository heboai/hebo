# syntax=docker/dockerfile:1

########################  build arguments  ########################
ARG SERVICE=api
ARG WORKSPACE=@hebo/api
ARG PORT=3001

########################  deps stage  ########################
FROM oven/bun:1.2.18 AS deps

ARG SERVICE
ARG WORKSPACE

WORKDIR /repo

COPY bun.lock bunfig.toml package.json ./
# Copy package manifests needed for the selected workspace and its deps
COPY apps/${SERVICE}/package.json apps/${SERVICE}/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared-api/package.json packages/shared-api/package.json
COPY packages/shared-data/package.json packages/shared-data/package.json
COPY infra/package.json infra/package.json

RUN bun install --filter "${WORKSPACE}" --frozen-lockfile --production

########################  builder stage  ########################
FROM oven/bun:1.2.18 AS builder

ARG SERVICE
ARG WORKSPACE

WORKDIR /repo

# Copy dependencies from deps stage
COPY --from=deps /repo/node_modules ./node_modules

# Copy source code
COPY . .

WORKDIR /repo/apps/${SERVICE}

# Build the application (relies on each app's build script)
RUN bun run build

########################  runner stage  ########################
FROM oven/bun:1.2.18 AS runner

ARG SERVICE
ARG PORT

ENV NODE_ENV=production

# Create an unprivileged user
RUN adduser --system --ingroup bun appuser

WORKDIR /repo

# Copy only production dependencies from deps stage
COPY --chown=appuser:bun --from=deps /repo/node_modules ./node_modules

# Copy the built application from builder stage
# To keep things generic across apps, copy the entire app directory
COPY --chown=appuser:bun --from=builder /repo/apps/${SERVICE} ./apps/${SERVICE}

USER appuser

WORKDIR /repo/apps/${SERVICE}

EXPOSE ${PORT}

# Use each app's start script for maximum flexibility
CMD ["bun", "run", "start"]


