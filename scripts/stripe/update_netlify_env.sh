#!/usr/bin/env bash
# Updates Netlify environment variables for Stripe prices (best effort via API).
# Usage:
#   export NETLIFY_AUTH_TOKEN=...
#   export NETLIFY_SITE_ID=...
#   export STRIPE_PRICE_WEEKLY=price_...
#   export STRIPE_PRICE_MONTHLY=price_...
#   ./scripts/stripe/update_netlify_env.sh

set -euo pipefail

for v in NETLIFY_AUTH_TOKEN NETLIFY_SITE_ID STRIPE_PRICE_WEEKLY STRIPE_PRICE_MONTHLY; do
  if [[ -z "${!v:-}" ]]; then echo "ERR: $v not set"; exit 1; fi
done

echo "Setting Netlify env vars..."
curl -sS -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN"   -H "Content-Type: application/json"   -X PATCH   -d "{"env": {"STRIPE_PRICE_WEEKLY": "$STRIPE_PRICE_WEEKLY", "STRIPE_PRICE_MONTHLY": "$STRIPE_PRICE_MONTHLY"}}"   https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID || true

echo "Note: If Netlify API schema changes, set these in the UI."
