#!/usr/bin/env bash
set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install gcloud: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

read -p "GCP Project ID: " PROJECT_ID
read -p "GitHub repo (e.g. KindCompanion/kindcompanion): " GH_REPO

SA_NAME="kc-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_ID="github-oidc"
PROVIDER_ID="github"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com --project "$PROJECT_ID"

gcloud iam workload-identity-pools create "$POOL_ID" --project="$PROJECT_ID" --location="global" --display-name="GitHub OIDC Pool" || true

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_ID" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" || true

PROVIDER_RESOURCE="projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT_ID" || true

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/run.admin" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/storage.admin" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/cloudbuild.builds.editor" >/dev/null

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${PROVIDER_RESOURCE}/attribute.repository/${GH_REPO}" >/dev/null

echo ""
echo "Add these to GitHub → Repo → Settings → Secrets:"
echo "  GCP_PROJECT_ID = ${PROJECT_ID}"
echo "  GCP_SERVICE_ACCOUNT = ${SA_EMAIL}"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER = ${PROVIDER_RESOURCE}"
