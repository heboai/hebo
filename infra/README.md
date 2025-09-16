# Hebo Infrastructure

This directory contains the infrastructure as code for the Hebo platform, built using [SST](https://sst.dev/) and deployed on AWS.

## Architecture Overview

The infrastructure consists of several key components:

- **Database**: Aurora PostgreSQL with global clustering
- **API**: ECS service (sst.aws.Service) on shared Cluster behind ALB
- **Gateway**: ECS service (sst.aws.Service) on shared Cluster behind ALB
- **Console**: Static site (React Router) via SST StaticSite (S3 + CloudFront)

## Infrastructure Components

### Database (`stacks/db.ts`)

Aurora PostgreSQL database with advanced features:

- **Engine**: PostgreSQL 17.X
- **Global Clustering**: Multi-region replication for production
- **Migrator**: Lambda function runs migrations automatically on deploy (non-dev)

### API (`stacks/api.ts`)

ECS service (sst.aws.Service) running on a shared Cluster behind an ALB:

- **Runtime**: Bun 1.x + ElysiaJS 1.x

### Gateway (`stacks/gateway.ts`)

ECS service (sst.aws.Service) running on the same Cluster behind an ALB:

- **Runtime**: Bun 1.x + ElysiaJS 1.x

### Console (`stacks/console.ts`)

- **Framework**: React Router

## Secrets

Use `.secrets.example` as the single source of truth for secret names. Copy it to `.secrets`, fill in values, and load them for your stage:

```bash
cp .secrets.example .secrets
# Edit values in .secrets
bun run sst secret load .secrets --stage <stage>
```

## Deployment

### Prerequisites

1. **Bun installed** (>= 1.2.x)
2. **AWS CLI configured**
3. **Docker installed and running**

### Setup the environment

```bash
cp .env.example .env
# Fill in your values
```

### Install SST providers

```bash
bun run sst install
```

### Deploy Infrastructure

```bash
# From project root
bun run sst deploy

# Or specific stage
bun run sst deploy --stage production
```

## Security

- **VPC Isolation**: All resources run within private subnets
- **Encryption**: Database storage encrypted at rest
- **IAM**: Least privilege access through SST
- **Container Security**: Non-root user, minimal Distroless base image
- **SSM**: Secrets and config managed in AWS Parameter Store

## Monitoring and Scaling

- **Database**: Aurora Serverless v2 with automatic scaling
- **API/Gateway**: ECS services behind ALB with desired count scaling
- **Console**: CDN-cached static site (CloudFront) for global performance

### Logs and Debugging

- **API/Gateway**: View service logs in CloudWatch Logs for `HeboApiService` and `HeboGatewayService`. Monitor ALB metrics (4xx/5xx) in CloudWatch.
- **Database**: Check RDS/Aurora cluster status and logs in the AWS Console or via `aws rds` CLI.
