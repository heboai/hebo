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
pnpm run dev:hebo-cloud
```

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
