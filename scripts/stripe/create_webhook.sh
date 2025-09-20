#!/usr/bin/env bash
# Creates/updates a Stripe webhook endpoint that points to your Make.com webhook URL.
# Requirements: bash + curl
# Usage:
#   export STRIPE_SECRET_KEY=sk_live_...
#   export MAKE_WEBHOOK_URL=https://hook.make.com/xxxxxxxx
#   ./scripts/stripe/create_webhook.sh

set -euo pipefail

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "ERR: STRIPE_SECRET_KEY not set"; exit 1
fi
if [[ -z "${MAKE_WEBHOOK_URL:-}" ]]; then
  echo "ERR: MAKE_WEBHOOK_URL not set"; exit 1
fi

echo "Creating Stripe webhook endpoint to: $MAKE_WEBHOOK_URL"

RESP=$(curl -sS https://api.stripe.com/v1/webhook_endpoints   -u "$STRIPE_SECRET_KEY:"   -d "url=$MAKE_WEBHOOK_URL"   -d "enabled_events[]=checkout.session.completed"   -d "enabled_events[]=payment_intent.payment_failed"   -d "enabled_events[]=charge.dispute.created" )

echo "$RESP"
echo "Done."
