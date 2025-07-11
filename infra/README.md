# Hebo Infrastructure

This directory contains the infrastructure as code for the Hebo platform, built using [SST](https://sst.dev/) and deployed on AWS.

## Architecture Overview

The infrastructure consists of several key components:

- **VPC**: Network isolation and security
- **Database**: Aurora PostgreSQL with global clustering
- **API**: Containerized API deployed on AWS App Runner
- **Frontend**: Next.js application with edge deployment

## Infrastructure Components

### VPC (`stacks/vpc.ts`)

The Virtual Private Cloud provides network isolation and security for all resources:

- **Production**: Standard VPC configuration
- **Development/Preview**: Includes bastion host and NAT gateway for development access

### Database (`stacks/db.ts`)

Aurora PostgreSQL database with advanced features:

- **Engine**: PostgreSQL 17.5
- **Global Clustering**: Multi-region replication for production
- **Scaling**: 
  - Production: Aurora Serverless v2 with 1 replica
  - Development: Auto-scaling with pause after 20 minutes of inactivity
- **Security**: Encrypted storage and proxy connection
- **Credentials**: Managed through SST secrets

### API (`stacks/api.ts`)

Containerized API deployed on AWS App Runner:

- **Container**: Docker image from ECR Public (`public.ecr.aws/m1o3d3n5/hebo-api:latest`)
- **Runtime**: Bun 1.2.18 with Hono.js 4.1.0 framework
- **Port**: 3001 (configurable)
- **VPC Integration**: Connected to database through VPC connector
- **Auto-deployment**: Disabled for manual control

### Frontend (`stacks/app.ts`)

Next.js application with edge deployment:

- **Framework**: Next.js with edge rendering
- **Domain**: 
  - Production: `cloud.hebo.ai`
  - Development: `{stage}.cloud.hebo.ai`
- **Environment**: Connected to API and external services

## Docker Deployment Process

The API deployment follows a containerized approach:

### Build Process (`stacks/build-api/`)

1. **Dockerfile**: Multi-stage build with Bun 1.2.18
   - Dependencies stage with Bun
   - Runtime stage with non-root user
   - Optimized for production

2. **Image Publishing Script** (`publish-image.sh`):
   ```bash
   # Build and publish to ECR Public
   ./infra/stacks/build-api/publish-image.sh
   ```

3. **ECR Public Registry**:
   - Repository: `hebo-api`
   - Image: `public.ecr.aws/m1o3d3n5/hebo-api:latest`
   - Region: `us-east-1`

### Local Development

```bash
# Run with Docker Compose
cd infra/stacks/build-api
docker-compose up --build

# Or build manually
docker build -t hebo-api -f infra/stacks/build-api/Dockerfile .
docker run -p 3001:3001 hebo-api
```

## Deployment

### Prerequisites

1. **AWS CLI configured**
2. **Docker installed and running**
3. **SST CLI installed**

### Deploy Infrastructure

```bash
# From project root
pnpm run deploy

# Or specific stage
pnpm run deploy --stage production
```

### Publish API Container Image

```bash
# Build and push to ECR Public
cd infra/stacks/build-api
./publish-image.sh
```

## Environment Variables

### Database Secrets
- `HeboDbUsername`: Database username
- `HeboDbPassword`: Database password

### Frontend Secrets
- `StackProjectId`: Stack project identifier
- `StackPublishableClientKey`: Stack publishable key
- `StackSecretServerKey`: Stack secret key
- `PosthogKey`: PostHog analytics key
- `PosthogHost`: PostHog host URL

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

## Development Workflow

1. **Local Development**: Use Docker Compose for API testing
2. **Infrastructure Changes**: Modify SST stacks and deploy
3. **API Updates**: Build new container image and publish to ECR
4. **Production Deployment**: Deploy infrastructure, then publish container image

## Cost Optimization

- **Development**: Database pauses after 20 minutes of inactivity
- **Production**: Aurora Serverless v2 with minimum 0.5 ACU
- **Container**: Multi-stage builds reduce image size
- **Edge**: Global distribution reduces latency 