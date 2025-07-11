# Hebo API

A modern Hono-based API server designed for the Hebo platform.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the application
pnpm run build
```

## API Endpoints

- `GET /` - Health check
- `GET /api/version` - Get version information

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build for production
pnpm run build
```

## Architecture

- **Framework**: Hono.js
- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Port**: 3001

## Environment Variables

The API expects the following environment variables when deployed:

- `PG_HOST`: PostgreSQL host
- `PG_PORT`: PostgreSQL port
- `PG_USER`: PostgreSQL username
- `PG_PASSWORD`: PostgreSQL password
- `PG_DATABASE`: PostgreSQL database name

## Deployment

The API is deployed as a containerized application on AWS App Runner. For Docker build and deployment instructions, see the [infra/README.md](../infra/README.md) documentation.
