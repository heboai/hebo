# Hebo Infrastructure

This directory contains the infrastructure as code for the Hebo platform, built using [SST](https://sst.dev/) and deployed on AWS.

## Architecture Overview

The infrastructure consists of several key components:

- **VPC**: Network isolation and security
- **Database**: Aurora PostgreSQL with global clustering
- **API**: ECS service (sst.aws.Service) on shared Cluster behind ALB
- **Gateway**: ECS service (sst.aws.Service) on shared Cluster behind ALB
- **Console**: Static site (React Router) via SST StaticSite (S3 + CloudFront)

## Infrastructure Components

### VPC (`stacks/vpc.ts`)

The Virtual Private Cloud provides network isolation and security for all resources:

- **NAT**: EC2-managed NAT gateways
- **Bastion**: Enabled for non-production stages for troubleshooting access

### Database (`stacks/db.ts`)

Aurora PostgreSQL database with advanced features:

- **Engine**: PostgreSQL 17.X
- **Global Clustering**: Multi-region replication for production
- **Scaling**:
  - Production: Aurora Serverless v2 with 1 replica
  - Preview: Auto-scaling with pause after 20 minutes of inactivity
- **Security**: Encrypted storage and proxy connection
- **Credentials**: Managed through SST secrets
- **Migrator**: Lambda function runs migrations automatically on deploy (non-dev)

### API (`stacks/api.ts`)

ECS service (sst.aws.Service) running on a shared Cluster behind an ALB:

- **Runtime**: Bun 1.x + ElysiaJS 1.x
- **Domain**: `api.hebo.ai` in production; `{stage}.dev.api.hebo.ai` in previews

### Gateway (`stacks/gateway.ts`)

ECS service (sst.aws.Service) running on the same Cluster behind an ALB:

- **Runtime**: Bun 1.x + ElysiaJS 1.x
- **Port**: 3002
- **Domain**: `gateway.hebo.ai` in production; `{stage}.dev.gateway.hebo.ai` in previews

### Console (`stacks/console.ts`)

- **Framework**: React Router
- **Domain**:
  - Production: `console.hebo.ai`
  - Preview: `{stage}.dev.console.hebo.ai`

### DNS (`stacks/dns.ts`)

- **Hosted Zone**: Ensures Route53 zone `hebo.ai` exists (creates if missing)
- **Domain pattern**:
  - Production: `{app}.hebo.ai`
  - Preview: `{stage}.dev.{app}.hebo.ai`

### Secrets (`stacks/secrets.ts`)

Required SST secrets:

- `StackProjectId`
- `StackSecretServerKey`
- `StackPublishableClientKey`
- `DbUsername`
- `DbPassword`
- `GroqApiKey`
- `VoyageApiKey`

## Deployment

### Prerequisites

1. **Bun installed** (>= 1.2.x)
2. **AWS CLI configured**
3. **Docker installed and running**

### Install SST providers

```bash
bun run sst:synth
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

## Monitoring and Scaling

- **Database**: Aurora Serverless v2 with automatic scaling
- **API/Gateway**: ECS services behind ALB with desired count scaling
- **Console**: CDN-cached static site (CloudFront) for global performance

### Logs and Debugging

- **API/Gateway**: View service logs in CloudWatch Logs for `HeboApiService` and `HeboGatewayService`. Monitor ALB metrics (4xx/5xx) in CloudWatch.
- **Database**: Check RDS/Aurora cluster status and logs in the AWS Console or via `aws rds` CLI.

## Cost Optimization

- **Preview**: Database pauses after 20 minutes of inactivity
- **Production**: Aurora Serverless v2 with minimum 0.5 ACU
- **Container**: Multi-stage builds reduce image size
- **Edge**: Global distribution reduces latency
