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

RUN bun install --filter "${WORKSPACE}" --frozen-lockfile --production

########################  builder stage  ########################
FROM oven/bun:1.2.18 AS builder

ARG SERVICE
ARG WORKSPACE

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules

COPY . .

WORKDIR /repo/apps/${SERVICE}

RUN bun run build

########################  runner stage  ########################
FROM oven/bun:1.2.18 AS runner

ARG SERVICE
ARG PORT

ENV NODE_ENV=production

RUN adduser --system --ingroup bun appuser

WORKDIR /repo

COPY --chown=appuser:bun --from=deps /repo/node_modules ./node_modules

COPY --chown=appuser:bun --from=builder /repo/apps/${SERVICE} ./apps/${SERVICE}

USER appuser

WORKDIR /repo/apps/${SERVICE}

EXPOSE ${PORT}

CMD ["./dist/server"] 


