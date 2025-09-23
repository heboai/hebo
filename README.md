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
│   ├── db/                         # Database schema, migrations & PGLite
│   ├── shared-api/                 # API utilities (auth, CORS)
│   ├── shared-data/                # Shared data models & schemas
│   └──shared-ui/                  # UI components (Shadcn + custom)
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

```bash
# Run the entire stack locally
bun run dev
```

```bash
# Apply migrations once dev is running
bun run db migrate
```

```bash
# configure env variables per each app
cd apps/console
cp .env.example .env
# Fill with your values
```

```bash
# Start only the console in dev
bun run -F @hebo/console dev
```

```bash
# Cleanup
bun run clean

# Cleanup the database (and any other untracked files/directories)
bun run -F @hebo/db clean
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