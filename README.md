# Hebo

This is the monorepo for Hebo, containing all our applications and shared packages.

## Repository Structure

```
/ (hebo)
├── apps/                   # Deployable targets
│   ├── api/                # Elysia API server
│   └── console/            # React Router web application
│
├── packages/               # Shareable libraries
│   ├── db/                 # Database schema and migrations
│   └── ui/                 # Common UI components
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
├── bunfig.toml             # Bun configuration
├── sst.config.ts           # SST configuration
└── turbo.json              # Turborepo configuration
```

## Getting Started

### Prerequisites

- Bun >= 1.2.19
- AWS CLI (only required for deployment)

### Installation

```bash
# Install dependencies
bun i
```

```bash
# Set up your environment variables
cp .env.example .env
```

### Development

```bash
# Init the development database
bun run db:migrate
```

```bash
# Run the entire stack locally
bun run dev
```

```bash
# Start only the console in dev
bun run -F @hebo/console dev
```

```bash
# Cleanup
bun run clean
```

```bash
# Cleanup just the DB package
bun run -F @hebo/db clean 
```

### Run modes

| #   | Mode                        | Command                    | Database                       | API availability                        |
| --- | --------------------------- | -------------------------- | ------------------------------ | --------------------------------------- |
| 1   | **Frontend-only** (offline) | `bun run -F @hebo/console dev` | —                              | none – UI relies on local state manager |
| 2   | **Local full-stack**        | `bun run dev`              | PGLite (`packages/db/hebo.db`) | http://localhost:3001                   |
| 3   | **Remote full-stack**       | `sst deploy`               | Aurora PostgreSQL              | HTTPS URL injected by SST               |

> **How the UI knows if the API is present**
>
> The web app reads `VITE_API_URL` at runtime:
>
> - If the variable is **empty or undefined** (mode #1), network hooks skip requests and components use valtio cache only.
> - For modes #2 and #3, the value is filled automatically (`http://localhost:3001` by `bun dev`, or the real API Gateway URL by `sst deploy`).
>
> Database-selection logic lives in `packages/db/drizzle.ts` and is **completely separated** from the API availability code in `...` [TBD].

### Building

```bash
# Build all packages and apps
bun run build

# Build specific package/console
bun run -F @hebo/console build
```

### Testing

```bash
# Run all tests
bun run test

# Test specific package/console
bun run -F @hebo/console test
```

### Deployment

The repository uses GitHub Actions for CI/CD:

- Push a new tag to trigger the deployment

#### Manual deployments:

For deployments, we utilize the SST framework (https://sst.dev/).
You can either install the SST CLI locally or use `bunx` to execute deployment commands manually.

```bash
# Install providers
sst install

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
