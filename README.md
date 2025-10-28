# Hebo

This is the monorepo for Hebo, containing all our applications and shared packages.

## Repository Structure

```
/ (hebo)
├── apps/                           # Deployable applications
│   ├── api/                        # REST API server (ElysiaJS)
│   ├── console/                    # Web console (React Router + Vite)
│   └── gateway/                    # AI Gateway (ElysiaJS + Vercel AI SDK)
│
├── packages/                       # Shared libraries and utilities
│   ├── aikit-respond-io/           # Respond.io AI Kit integration
│   ├── aikit-ui/                   # Chat UI components (Shadcn + custom)
│   ├── database/                   # Database schema, migrations (Prisma)
│   ├── shared-api/                 # API utilities (auth, CORS)
│   ├── shared-data/                # Shared data models & schemas
│   └── shared-ui/                  # UI components (Shadcn + custom)
│
├── infra/                          # Infrastructure as Code (SST)
│   └── stacks/                     # SST stacks
│
├── .github/
│   └── workflows/                  # CI/CD pipelines
│
├── bunfig.toml                     # Bun configuration
├── lefthook.yml                    # Git hooks configuration
├── eslint.config.mjs               # ESLint configuration
├── sst.config.ts                   # SST configuration
├── tsconfig.base.json              # Base TypeScript configuration
└── turbo.json                      # Turborepo configuration
```

## Prerequisites

- Bun >= 1.2.22
- Docker >= 28
- AWS CLI (only required for deployment)

## Installation

```bash
# Install dependencies
bun install
```

## Development

### Quick start

```bash
# 1) Start Postgres (Docker)
bun run db:start

# 2) Apply migrations
bun run db:migrate

# 3) Run all apps (API, Gateway, Console)
bun run dev

# Optional - console only (from repo root)
bun run -F @hebo/console dev
```

### Environment variables

- Each app manages its own environment (e.g. `.env`, `.env.local`). Create a `.env` inside the app directory if you need to override defaults.

```bash
cd apps/console
cp .env.example .env
```

### Database

```bash
# Start
bun run db:start

# Stop
bun run db:stop

# Migrate
bun run db:migrate

# Reset (drops data)
bun run db:reset
```

### Cleanup

```bash
bun run clean
```

## Run modes

| #   | Mode                         | Command                          | Database              | API availability                        |
|-----|------------------------------|----------------------------------|-----------------------|-----------------------------------------|
| 1   | **Frontend-only** (offline)  | `bun run -F @hebo/console dev`    | —                     | none – UI relies on MSW / MSW data       |
| 2   | **Local full-stack**         | `bun run dev`                    | Dockerized PostgreSQL | URLs from env              |
| 3   | **Remote full-stack**        | `bun run sst deploy`             | Aurora PostgreSQL     | HTTPS URLs exported by SST              |

## Building

```bash
# Build all packages and apps
bun run build

# Build specific package/console
bun run -F @hebo/console build
```

## Testing

```bash
# Run all tests
bun run test

# Test specific package/console
bun run -F @hebo/console test
```

## Deployment

The repository uses GitHub Actions for CI/CD:

- Push a new tag to trigger the deployment

### Service URLs

- API: `https://api.hebo.ai` (prod) or `https://api.<stage>.hebo.ai` (preview)
- Gateway: `https://gateway.hebo.ai` (prod) or `https://gateway.<stage>.hebo.ai` (preview)
- Console: `https://console.hebo.ai` (prod) or `https://console.<stage>.hebo.ai` (preview)

### Manual deployments

For deployments, we utilize the SST framework ([sst.dev](https://sst.dev/)).

#### Secrets

Set each secret individually.

Secrets to set:

##### LLM keys

- `GroqApiKey`
- `VoyageApiKey`

##### Auth secrets

Get these by creating a project on [Stack Auth](https://app.stack-auth.com).

- `StackSecretServerKey`
- `StackPublishableClientKey`
- `StackProjectId`

##### Examples usage:

Replace `<value>`. Omit `--stage` for local development (defaults to your dev stage).

```bash
bun run sst secret set GroqApiKey <value> --stage <stage>
```

#### Launch and Clean up

```bash
# Install providers
bun run sst install

# Deploy a preview link
bun run sst deploy --stage PR-XX

# Remove a preview link
bun run sst remove --stage PR-XX

# Deploy to production
bun run sst deploy --stage production
```