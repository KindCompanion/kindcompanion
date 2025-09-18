import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import fetch from 'node-fetch';

const log = pino();
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST'] }));
app.use(express.json({ limit: '1mb' }));

app.get('/health/live', (req, res) => res.status(200).send('OK'));

// Stripe webhook placeholder (prevents 404 during setup)
app.post('/stripe/webhook', (req, res) => {
  log.info({ event: 'stripe_webhook_received' });
  return res.status(200).send('ok');
});

app.post('/wa/inbound', async (req, res) => {
  try {
    const from = req.body?.from || 'unknown';
    const text = req.body?.text?.body || req.body?.message || '';
    if (!text) return res.status(200).json({ handled: true });

    let reply = "I’m here with you. Tell me a bit more about what’s on your mind 💙";
    if (process.env.OPENAI_API_KEY) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: process.env.COMPOSER_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are KindCompanion — warm, concise, safe. ~120 tokens max." },
              { role: "user", content: text }
            ],
            temperature: 0.6,
            max_tokens: 220
          })
        });
        if (r.ok) {
          const j = await r.json();
          reply = j.choices?.[0]?.message?.content?.trim() || reply;
        }
      } catch {}
    }

    log.info({ event: 'message', from, text: text.slice(0, 500), reply: reply.slice(0, 500) });
    return res.json({ to: from, type: 'text', text: reply });
  } catch (e) {
    log.error({ err: String(e) });
    return res.status(200).json({ handled: true });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => log.info({ port }, 'KindCompanion listening'));
scripts/bootstrap_gcp_wif.sh
Content:

bash
Copy code
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
  --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_ID" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" || true
PROVIDER_RESOURCE="projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT_ID" || true
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/run.admin" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/cloudbuild.builds.editor" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/artifactregistry.admin" >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${PROVIDER_RESOURCE}/attribute.repository/${GH_REPO}" >/dev/null
echo ""
echo "Add these to GitHub → Repo → Settings → Secrets:"
echo "  GCP_PROJECT_ID = ${PROJECT_ID}"
echo "  GCP_SERVICE_ACCOUNT = ${SA_EMAIL}"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER = ${PROVIDER_RESOURCE}"
