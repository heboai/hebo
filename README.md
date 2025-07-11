# Hebo

This is the monorepo for Hebo, containing all our applications and shared packages.

## Repository Structure

```
/ (git root)
├── apps/                   # deployable targets
│   ├── api/                # Hono API server
│   ├── app/                # Next.js Front End application
│   └── docs/               # Next.js application for the documentation
│
├── packages/               # shareable libraries
│   └── db/                 # Database schema and migrations
│
├── infra/                  # SST infrastructure stacks
│   └── stacks/
│       ├── api.ts
│       ├── app.ts
│       ├── db.ts
│       └── vpc.ts
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│       ├── deploy.yml
│       └── quality.yml
│
├── sst.config.ts           # SST configuration
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace configuration
```

## Getting Started

### Prerequisites

- Bun >= 1.2.18
- pnpm >= 9.0.0
- AWS CLI configured with appropriate credentials

### Installation

```bash
# Install dependencies
pnpm i
```

```bash
# Set up your environment variables
cp .env.example .env
```

### Development

```bash
# Init the development database
pnpm run db:push
```

```bash
# Run the entire stack locally
pnpm dev
```

```bash
# Start only the app in dev (FE-only)
pnpm --filter @hebo/app run dev:local
```

### Run modes

| # | Mode | Command | Database | API availability |
|---|------|---------|----------|------------------|
| 1 | **Frontend-only** (offline) | `pnpm --filter @hebo/app run dev:local` | — | none – UI relies on local state manager |
| 2 | **Local full-stack** | `pnpm dev` | SQLite (`packages/db/hebo.db`) | http://localhost:3001 |
| 3 | **Remote full-stack** | `sst deploy` | Aurora PostgreSQL | HTTPS URL injected by SST |

> **How the UI knows if the API is present**
>
> The web app reads `NEXT_PUBLIC_API_URL` at runtime:
>
> * If the variable is **empty or undefined** (mode #1), network hooks skip requests and components use valtio cache only.
> * For modes #2 and #3, the value is filled automatically (`http://localhost:3001` by `pnpm dev`, or the real API Gateway URL by `sst deploy`).
>
> Database-selection logic lives in `packages/db/drizzle.ts` and is **completely separated** from the API availability code in `...` [TBD].

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package/app
pnpm --filter @hebo/app build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package/app
pnpm --filter @hebo/app test
```

### Deployment

The repository uses GitHub Actions for CI/CD:

- Push a new tag to trigger the deployment

#### Manual deployments:

For deployments, we utilize the SST framework (http://sst.dev/).
You can either install the SST CLI locally or use `npx` to execute deployment commands manually.

```bash
# Set secrets

sst secret set HeboDbUsername <username> --stage <stage>
sst secret set HeboDbPassword <password> --stage <stage>

# The same for StackProjectId, StackPublishableClientKey, StackSecretServerKey, PosthogKey, PosthogHost

# Deploy a preview link
sst deploy --stage PR-XX

# Remove a preview link
sst remove --stage PR-XX

# Deploy to production
sst deploy --stage production
```
