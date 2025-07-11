# Hebo API

A modern Hono-based API server designed for the Hebo platform, powered by Bun runtime.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the application
pnpm run build
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build for production
pnpm run build

# Test Bun migration
pnpm run test:migration
```

## Architecture

- **Framework**: Hono.js 4.1.0
- **Runtime**: Bun 1.2.18
- **Language**: TypeScript
- **Port**: 3001 (configurable via PORT env var)

## Environment Variables

The API expects the following environment variables when deployed:

- `PORT`: Server port (default: 3001)
- `PG_HOST`: PostgreSQL host
- `PG_PORT`: PostgreSQL port
- `PG_USER`: PostgreSQL username
- `PG_PASSWORD`: PostgreSQL password
- `PG_DATABASE`: PostgreSQL database name

## Deployment

The API is deployed as a containerized application on AWS App Runner. For Docker build and deployment instructions, see the [infra/README.md](../infra/README.md) documentation.
