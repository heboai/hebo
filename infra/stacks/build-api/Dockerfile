# syntax=docker/dockerfile:1

########################  deps stage  ########################
FROM node:20-alpine AS deps

# Install minimal utilities required by pnpm / Node
RUN apk add --no-cache libc6-compat

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Copy other package manifests that api depends on (db + itself)
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json

RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile --prod

########################  runner stage  ########################
FROM node:20-alpine AS runner

# Create an unprivileged user
RUN addgroup -S nodejs && adduser -S appuser -G nodejs

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules

COPY . .

# Runtime tooling – tsx binary
RUN npm install -g tsx

USER appuser

WORKDIR /repo/apps/api

EXPOSE 3001

CMD ["tsx", "src/index.ts"] 