# Hebo API

A modern Elysia-based API server designed for the Hebo platform, powered by Bun runtime.

## Development

```bash
# Install dependencies
bun i

# Run in development mode
bun dev

# Build for production
bun build
```

## Architecture

- **Framework**: Elysia 1.3.8
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

## Authentication

Most API endpoints require authentication and accepts Bearer Token (API Key) or Access Token (JWT) authentication.

To authenticate via Bearer Token, add an `Authorization: Bearer <your token>` to the header.

To authenticate via Access Token, add a `X-Access-Token: <your token>` to the header.
