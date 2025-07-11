#!/bin/bash

# Hebo API Docker Image Publishing Script
# This script builds and publishes the Docker image to AWS ECR Public

set -e

# Configuration
REPOSITORY_NAME="hebo-api"
REGION="us-east-1"
IMAGE_TAG="latest"
ECR_URI="public.ecr.aws/m1o3d3n5/${REPOSITORY_NAME}:${IMAGE_TAG}"
LOCAL_IMAGE_NAME="hebo-api"

echo "🚀 Starting Hebo API image publishing to AWS ECR Public..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Login to ECR Public
echo "🔑 Logging in to AWS ECR Public..."
aws ecr-public get-login-password --region ${REGION} | \
    docker login --username AWS --password-stdin public.ecr.aws

# Build the Docker image (from monorepo root)
echo "🔨 Building Docker image..."
cd ../../../ && docker build -t ${LOCAL_IMAGE_NAME}:${IMAGE_TAG} -f infra/stacks/build-api/Dockerfile .

# Tag the image for ECR
echo "🏷️  Tagging image for ECR..."
docker tag ${LOCAL_IMAGE_NAME}:${IMAGE_TAG} ${ECR_URI}

# Push to ECR Public
echo "📤 Pushing image to ECR Public..."
docker push ${ECR_URI}

echo "✅ Image publishing completed successfully!"
echo "📋 Image URI: ${ECR_URI}"
echo "🌐 You can now pull this image using: docker pull ${ECR_URI}"