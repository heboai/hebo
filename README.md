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
│   ├── db/                         # Database schema, migrations & PGLite
│   ├── shared-api/                 # API utilities (auth, CORS)
│   ├── shared-data/                # Shared data models & schemas
│   └── ui/                         # UI components (Shadcn + custom)
│
├── infra/                          # Infrastructure as Code (SST)
│   ├── stacks/                     # SST stacks
│   └── package.json                # Infra dependencies
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

## Getting Started

### Prerequisites

- Bun >= 1.2.19
- AWS CLI (only required for deployment)

### Installation

```bash
# Install dependencies
bun install
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
| 3   | **Remote full-stack**       | `bun run sst deploy`               | Aurora PostgreSQL              | HTTPS URL injected by SST               |

> **How the UI knows if the API is present**
>
> The web app reads `VITE_API_URL` at runtime:
>
> - If the variable is **empty or undefined** (mode #1), network hooks skip requests and components use valtio cache only.
> - For modes #2 and #3, the value is filled automatically (`http://localhost:3001` by `bun run dev`, or the real API Gateway URL by `bun run sst deploy`).
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

```bash
# Install providers
bun run sst:synth

# Set secrets

bun run sst secret set DbUsername <username> --stage <stage>
bun run sst secret set DbPassword <password> --stage <stage>
...

# Deploy a preview link
bun run sst deploy --stage PR-XX

# Remove a preview link
bun run sst remove --stage PR-XX

# Deploy to production
bun run sst deploy --stage production
```
