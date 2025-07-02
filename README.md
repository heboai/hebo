# Hebo

This is the monorepo for Hebo, containing all our applications and shared packages.

## Repository Structure

```
/ (git root)
├── apps/                    # deployable targets
│   └── hebo-cloud/         # Next.js web application
├── packages/               # shareable libraries
├── infra/                  # SST stacks
│   ├── stacks/
│   │   ├── db.ts
│   │   └── hebo-cloud.ts
│   └── sst.config.ts
└── .github/
    └── workflows/          # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose (for local development database)

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

To start all services locally:

```bash
# Start the development database
docker compose up -d db

# Verify the database is running
docker compose ps
```

```bash
# Start dev with sst
pnpm run dev:sst
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
# Deploy web app to staging
npx sst deploy --stage staging

# Deploy web app to production
npx sst deploy --stage production
```
