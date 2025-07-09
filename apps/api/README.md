# Hebo API

A modern Hono-based API server containerized with Docker and deployable to AWS ECR Public.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the application
pnpm run build

# Run locally with Docker
pnpm run docker:run
```

## Docker Commands

### Local Development

```bash
# Build the Docker image
pnpm run docker:build

# Run the container locally
pnpm run docker:run

# Or use Docker Compose
docker-compose up --build
```

### AWS ECR Public Deployment

#### Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI (if not already installed)
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS credentials
   aws configure
   ```

2. **Docker installed and running**
   ```bash
   # Check if Docker is running
   docker info
   ```

#### Deploy to ECR Public

**Option 1: Using the deployment script (Recommended)**
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

**Option 2: Manual deployment**
```bash
# Setup ECR repository
pnpm run ecr:setup

# Login to ECR Public
pnpm run ecr:login

# Build and push to ECR
pnpm run docker:push
```

**Option 3: Step by step**
```bash
# 1. Create ECR Public repository
aws ecr-public create-repository --repository-name hebo/api --region us-east-1

# 2. Login to ECR Public
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

# 3. Build the image
docker build -t hebo-api .

# 4. Tag for ECR
docker tag hebo-api:latest public.ecr.aws/hebo/api:latest

# 5. Push to ECR Public
docker push public.ecr.aws/hebo/api:latest
```

## Image Details

- **Image URI**: `public.ecr.aws/hebo/api:latest`
- **Region**: `us-east-1`
- **Repository**: `hebo/api`
- **Base Image**: `node:20-alpine`
- **Port**: `3001`

## Usage

### Pull and Run the Published Image

```bash
# Pull the image from ECR Public
docker pull public.ecr.aws/hebo/api:latest

# Run the container
docker run -p 3001:3001 public.ecr.aws/hebo/api:latest
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  hebo-api:
    image: public.ecr.aws/hebo/api:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
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

## Troubleshooting

### Common Issues

1. **AWS credentials not configured**
   ```bash
   aws configure
   ```

2. **Docker not running**
   ```bash
   # Start Docker Desktop or Docker daemon
   sudo systemctl start docker  # Linux
   ```

3. **ECR login failed**
   ```bash
   # Clear Docker credentials and retry
   docker logout public.ecr.aws
   aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
   ```

4. **Permission denied on deploy.sh**
   ```bash
   chmod +x deploy.sh
   ```

## Security

- The Docker image runs as a non-root user
- Uses Alpine Linux for minimal attack surface
- Multi-stage build reduces image size
- Production-optimized with NODE_ENV=production

## Architecture

- **Framework**: Hono.js
- **Runtime**: Node.js 20
- **Container**: Alpine Linux
- **Registry**: AWS ECR Public
- **Region**: us-east-1
