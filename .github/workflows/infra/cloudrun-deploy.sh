#!/usr/bin/env bash
set -euo pipefail

SERVICE=${SERVICE:-kindcompanion-api}
REGION=${REGION:-europe-west2}
PROJECT=${GOOGLE_CLOUD_PROJECT:-${GCP_PROJECT_ID:-}}

if [ -z "${PROJECT}" ]; then
  echo "Set GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID env." >&2
  exit 1
fi

COMMIT=${GITHUB_SHA:-$(date +%s)}
IMAGE="europe-west2-docker.pkg.dev/${PROJECT}/kc-api/kc:${COMMIT}"

echo "Creating Artifact Registry (if missing)..."
gcloud artifacts repositories create kc-api --repository-format=docker --location=${REGION} --project ${PROJECT} || true

echo "Building image..."
gcloud builds submit --tag $IMAGE ./backend --project ${PROJECT}

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --project ${PROJECT} \
  --set-env-vars OPENAI_API_KEY=${OPENAI_API_KEY},STRIPE_SECRET=${STRIPE_SECRET},STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET},DATABASE_URL=${DATABASE_URL},APP_PUBLIC_URL=${APP_PUBLIC_URL}
