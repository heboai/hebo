# Hebo API

A modern Elysia-based API server designed for the Hebo platform, powered by Bun runtime.

## Quick Start

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the application
bun run build
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build
```

## Architecture

- **Framework**: Elysia 1.3.8
- **Runtime**: Bun 1.2.18
- **Language**: TypeScript
- **Port**: 3001 (configurable via PORT env var)

## Environment Variables

The API expects the following environment variables when deployed:

- `PORT`: Server port (default: 3001)
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name

## Deployment

The API is deployed as a containerized application on AWS App Runner. For Docker build and deployment instructions, see the [infra/README.md](../infra/README.md) documentation.

## Authentication

Most API endpoints require authentication and accepts Bearer Token (API Key) or Access Token (JWT) authentication.

To authenticate via Bearer Token, add an `Authorization: Bearer <your token>` to the header.

To authenticate via Access Token, add a `X-Access-Token: <your token>` to the header.
