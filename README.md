# Hebo

This is the monorepo for Hebo, containing all our applications and shared packages.

## Repository Structure

```
/ (git root)
├── apps/                   # deployable targets
│   ├── api/                # Hono API server
│   └── hebo-cloud/         # Next.js web application
│
├── packages/               # shareable libraries
│   └── db/                 # Database schema and migrations
│
├── infra/                  # SST infrastructure stacks
│   └── stacks/
│       ├── dev/            # Development environment stacks
│       │   ├── api.ts
│       │   ├── db.ts
│       │   └── hebo-cloud.ts
│       └── stage/          # Staging environment stacks
│           ├── api.ts
│           ├── db.ts
│           ├── hebo-cloud.ts
│           └── vpc.ts
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

- Node.js >= 18
- pnpm >= 9.0.0
- AWS CLI configured with appropriate credentials

### Installation

1. Install dependencies:
   ```bash
   pnpm i
   ```

2. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```

### Development

```bash
# Init the development database
pnpm run db:push
```

```bash
# Start dev with sst (Full stack)
pnpm run dev:sst
```

```bash
# Run the entire stack locally without sst (Full stack)
pnpm dev
```

```bash
# Start only the hebo-cloud application Dev (FE-only)
pnpm --filter @hebo/hebo-cloud run dev:local
```

### Run modes

| # | Mode | Command | Database | API availability |
|---|------|---------|----------|------------------|
| 1 | **Frontend-only** (offline) | `pnpm --filter @hebo/hebo-cloud run dev:local` | — | none – UI relies on local state manager |
| 2 | **Local full-stack** | `pnpm dev` *or* `sst dev` | SQLite (`packages/db/hebo.db`) | http://localhost:3001 |
| 3 | **Remote full-stack** | `sst deploy` | Aurora PostgreSQL | HTTPS URL injected by SST |

> **How the UI knows if the API is present**
>
> The web app reads `NEXT_PUBLIC_API_URL` at runtime:
>
> * If the variable is **empty or undefined** (mode #1), network hooks skip requests and components use Zustand/Redux/TanStack Query cache only.
> * For modes #2 and #3, the value is filled automatically (`http://localhost:3001` by `sst dev`, or the real API Gateway URL by `sst deploy`).
>
> This logic lives in `apps/hebo-cloud/src/lib/config.ts` and is **completely separated** from the database-selection code in `packages/db/`.

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package/app
pnpm --filter hebo-cloud build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package/app
pnpm --filter hebo-cloud test
```

### Deployment

The repository uses GitHub Actions for CI/CD:

- Push a new tag to trigger the deployment

Manual deployments:

```bash
# Set secrets
npx sst secret set HeboDatabasePassword <password>
npx sst secret set HeboDatabaseUsername <username>

# Deploy web app to staging
npx sst deploy --stage staging

# Deploy web app to production
npx sst deploy --stage production
```
