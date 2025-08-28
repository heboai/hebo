#!/bin/bash

# Hebo Service Docker Image Publishing Script (API/Gateway)
# Usage:
#   ./infra/stacks/build-service/publish-image.sh api
#   ./infra/stacks/build-service/publish-image.sh gateway

set -euo pipefail

SERVICE="${1:-${SERVICE:-}}"
if [[ -z "${SERVICE}" ]]; then
  echo "❌ SERVICE not provided. Usage: publish-image.sh <api|gateway>"
  exit 1
fi

case "${SERVICE}" in
  api)
    REPOSITORY_NAME="hebo-api"
    DOCKERFILE="infra/stacks/build-service/Dockerfile.api"
    ;;
  gateway)
    REPOSITORY_NAME="hebo-gateway"
    DOCKERFILE="infra/stacks/build-service/Dockerfile.gateway"
    ;;
  *)
    echo "❌ Invalid SERVICE: ${SERVICE}. Expected 'api' or 'gateway'"
    exit 1
    ;;
 esac

REGION="us-east-1"
IMAGE_TAG="latest"
ECR_URI="public.ecr.aws/m1o3d3n5/${REPOSITORY_NAME}:${IMAGE_TAG}"
LOCAL_IMAGE_NAME="${REPOSITORY_NAME}"

echo "🚀 Publishing ${SERVICE} image to AWS ECR Public..."

# Check requirements
if ! command -v aws >/dev/null 2>&1; then
  echo "❌ AWS CLI is not installed."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running."
  exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity >/dev/null 2>&1 || {
  echo "❌ AWS credentials not configured. Run 'aws configure'."
  exit 1
}

# Login to ECR Public
echo "🔑 Logging in to AWS ECR Public..."
aws ecr-public get-login-password --region "${REGION}" | docker login --username AWS --password-stdin public.ecr.aws

# Build
echo "🔨 Building Docker image for ${SERVICE}..."
cd ../../../

docker build \
  -t "${LOCAL_IMAGE_NAME}:${IMAGE_TAG}" \
  -f "${DOCKERFILE}" \
  .

# Tag
echo "🏷️  Tagging image as ${ECR_URI}..."
docker tag "${LOCAL_IMAGE_NAME}:${IMAGE_TAG}" "${ECR_URI}"

# Push
echo "📤 Pushing image to ECR Public..."
docker push "${ECR_URI}"

# Optional: Upload repository catalog data if present
CATALOG_FILE="infra/stacks/build-service/catalog/${SERVICE}.json"
if [[ -f "${CATALOG_FILE}" ]]; then
  echo "📚 Updating ECR Public repository catalog data from ${CATALOG_FILE}..."
  # Extract fields
  ABOUT_TEXT=$(jq -r '.aboutText' "${CATALOG_FILE}")
  ARCHS=$(jq -r '.architectures | join(",")' "${CATALOG_FILE}")
  OSES=$(jq -r '.operatingSystems | join(",")' "${CATALOG_FILE}")
  USAGE_TEXT=$(jq -r '.usageText' "${CATALOG_FILE}")

  aws ecr-public put-repository-catalog-data \
    --region "${REGION}" \
    --repository-name "${REPOSITORY_NAME}" \
    --catalog-data "aboutText=${ABOUT_TEXT},architectures=${ARCHS},operatingSystems=${OSES},usageText=${USAGE_TEXT}" || true
fi

echo "✅ ${SERVICE} image published successfully!"
echo "📋 Image URI: ${ECR_URI}"
echo "🌐 Pull with: docker pull ${ECR_URI}"
