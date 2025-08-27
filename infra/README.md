# Hebo Infrastructure

This directory contains the infrastructure as code for the Hebo platform, built using [SST](https://sst.dev/) and deployed on AWS.

## Architecture Overview

The infrastructure consists of several key components:

- **VPC**: Network isolation and security
- **Database**: Aurora PostgreSQL with global clustering
- **API**: Containerized API deployed on AWS App Runner
- **Gateway** Containerized Gateway deployed on AWS App Runner
- **Frontend**: Next.js application with edge deployment

## Infrastructure Components

### VPC (`stacks/vpc.ts`)

The Virtual Private Cloud provides network isolation and security for all resources:

- **Production**: Standard VPC configuration
- **Preview**: Includes bastion host and NAT gateway for troubleshooting access from local

### Database (`stacks/db.ts`)

Aurora PostgreSQL database with advanced features:

- **Engine**: PostgreSQL 17.5
- **Global Clustering**: Multi-region replication for production
- **Scaling**:
  - Production: Aurora Serverless v2 with 1 replica
  - Preview: Auto-scaling with pause after 20 minutes of inactivity
- **Security**: Encrypted storage and proxy connection
- **Credentials**: Managed through SST secrets

### API (`stacks/api.ts`)

Containerized API deployed on AWS App Runner:

- **Container**: Docker image from ECR Public (`public.ecr.aws/m1o3d3n5/hebo-api:latest`)
- **Runtime**: Bun 1.2.18 with Elysia 1.3.8 framework
- **Port**: 3001 (configurable)
- **VPC Integration**: Connected to database through VPC connector
- **Auto-deployment**: Disabled for manual control

### Gateway (`stacks/gateway.ts`)

Containerized Gateway deployed on AWS App Runner:

- **Container**: Docker image from ECR Public (`public.ecr.aws/m1o3d3n5/hebo-gateway:latest`)
- **Runtime**: Bun 1.2.18 with Elysia 1.3.8 framework
- **Port**: 3002 (configurable)
- **VPC Integration**: Connected to database through VPC connector
- **Auto-deployment**: Disabled for manual control

### Frontend (`stacks/app.ts`)

Next.js application with edge deployment:

- **Framework**: Next.js with edge rendering
- **Domain**:
  - Production: `cloud.hebo.ai`
  - Preview: `{stage}.cloud.hebo.ai`
- **Environment**: Connected to API and external services

## Docker Deployment Process

The services deployment follows a containerized approach with a generic build pipeline:

### Build Process (`stacks/build-service/`)

1. **Dockerfile**: Multi-stage build with Bun 1.2.18
   - Parameterized by `SERVICE` (`api` or `gateway`) and `PORT`
   - Dependencies stage with Bun
   - Runtime stage with non-root user
   - Optimized for production

2. **Image Publishing Script** (`publish-image.sh`):

   ```bash
   # Build and publish to ECR Public (from repo root)
   bun -v # ensure bun is installed
   ./infra/stacks/build-service/publish-image.sh api
   ./infra/stacks/build-service/publish-image.sh gateway
   ```

3. **ECR Public Registry**:
   - API Repository/Image: `public.ecr.aws/m1o3d3n5/hebo-api:latest`
   - Gateway Repository/Image: `public.ecr.aws/m1o3d3n5/hebo-gateway:latest`
   - Region: `us-east-1`

## Deployment

### Prerequisites

1. **AWS CLI configured**
2. **Docker installed and running**
3. **SST CLI installed**

### Deploy Infrastructure

```bash
# From project root
bun run deploy

# Or specific stage
bun run deploy --stage production
```

### Publish Service Container Images

```bash
# Build and push to ECR Public
bun run --cwd infra docker:push:api
bun run --cwd infra docker:push:gateway
```

## Environment Variables

### Database Secrets

- `HeboDbUsername`: Database username
- `HeboDbPassword`: Database password

### Frontend Secrets

- `StackProjectId`: Stack project identifier
- `StackPublishableClientKey`: Stack publishable key
- `StackSecretServerKey`: Stack secret key

## Security

- **VPC Isolation**: All resources run within private subnets
- **Encryption**: Database storage encrypted at rest
- **IAM**: Least privilege access through SST
- **Container Security**: Non-root user, minimal Alpine base image

## Monitoring and Scaling

- **Database**: Aurora Serverless v2 with automatic scaling
- **API**: App Runner with automatic scaling based on load
- **Frontend**: Edge deployment for global performance

## Troubleshooting

### Common Issues

1. **VPC Connector Issues**:
   - Verify security group rules
   - Check subnet configuration

2. **Database Connection**:
   - Ensure VPC connector is properly configured
   - Verify database credentials in secrets

3. **Container Image Publishing**:
   - Check ECR Public login status
   - Verify Docker build context

### Logs and Debugging

```bash
# View App Runner logs
aws apprunner describe-service --service-arn <service-arn>

# Check database status
aws rds describe-db-clusters --db-cluster-identifier <cluster-id>
```

## Cost Optimization

- **Preview**: Database pauses after 20 minutes of inactivity
- **Production**: Aurora Serverless v2 with minimum 0.5 ACU
- **Container**: Multi-stage builds reduce image size
- **Edge**: Global distribution reduces latency
