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
- Windows: Bash must be installed and on PATH. Install via [WSL](https://learn.microsoft.com/windows/wsl/install), [Git for Windows (Git Bash)](https://git-scm.com/download/win), or [Cygwin](https://www.cygwin.com/).

## Installation

```bash
# Install dependencies
bun install
```

## Secrets

Set each secret individually before running development.

Secrets to set:

LLM keys
- `GroqApiKey`
- `VoyageApiKey`

Auth secrets (optional)
- `StackSecretServerKey`
- `StackPublishableClientKey`
- `StackProjectId`

Database (only required for deployments)
- `DbUsername`
- `DbPassword`

Examples usage:

- Replace `<value>` and `<stage>`
- The `--stage <stage>` is not required in development.

```bash
bun run sst secret set GroqApiKey <value> --stage <stage>
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
# Start only the console in dev
APP=console bun run dev
```

```bash
# Cleanup
bun run clean

# Cleanup the database (any any other untracked files/directories)
bun run -F @hebo/infra clean
```

## Run modes

| #   | Mode                         | Command                          | Database              | API availability                        |
|-----|------------------------------|----------------------------------|-----------------------|-----------------------------------------|
| 1   | **Frontend-only** (offline)  | `APP=console bun run dev:app`    | —                     | none – UI relies on MSW / MSW data       |
| 2   | **Local full-stack**         | `bun run dev`                    | Dockerized PostgreSQL | HTTPS URLs injected by SST              |
| 3   | **Remote full-stack**        | `bun run sst deploy`             | Aurora PostgreSQL     | HTTPS URLs injected by SST              |

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

### Manual deployments

For deployments, we utilize the SST framework ([sst.dev](https://sst.dev/)).

```bash
# Install providers
bun run sst install

# Ensure secrets are set for your desired stage (--stage flag) including DbUsername, and DbPassword secrets

# Deploy a preview link
bun run sst deploy --stage PR-XX

# Remove a preview link
bun run sst remove --stage PR-XX

# Deploy to production
bun run sst deploy --stage production
```

### Service URLs

- API: `https://api.hebo.ai` (prod) or `https://api.<stage>.hebo.ai` (preview)
- Gateway: `https://gateway.hebo.ai` (prod) or `https://gateway.<stage>.hebo.ai` (preview)
- Console: `https://console.hebo.ai` (prod) or `https://console.<stage>.hebo.ai` (preview)
