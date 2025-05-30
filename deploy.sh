#!/usr/bin/env bash
# Deployment script for Spring Boot backend to Google Cloud Run
# Usage: ./deploy.sh

set -euo pipefail

# Configuration (edit if needed)
PROJECT_ID="sportapp-460811"
SERVICE_NAME="backend-app"
REGION="europe-west1"
MEMORY="512Mi"
CONCURRENCY=80
TIMEOUT="300s"
IMAGE_TAG="latest"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"

# Paths
BACKEND_DIR="backend"
ENV_FILE="env.yaml"

# 1. Build the Spring Boot JAR
echo "🔨 Building Spring Boot application..."
cd "${BACKEND_DIR}"
./mvnw clean package -DskipTests

echo "✅ JAR built at ${BACKEND_DIR}/target"

# 2. Build Docker image
echo "🐳 Building Docker image..."
docker build -t "${SERVICE_NAME}" .

# 3. Authenticate Docker to GCR using gcloud access token
echo "🔑 Authenticating Docker to GCR..."
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://gcr.io

echo "🏷 Tagging image as ${IMAGE_NAME}"
docker tag "${SERVICE_NAME}" "${IMAGE_NAME}"

echo "⏫ Pushing image to GCR..."
docker push "${IMAGE_NAME}"

# 4. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run (${SERVICE_NAME})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --memory="${MEMORY}" \
  --concurrency="${CONCURRENCY}" \
  --timeout="${TIMEOUT}" \
  --env-vars-file="${ENV_FILE}" \
  --quiet

# 5. Done
echo "🎉 Deployment complete!"
