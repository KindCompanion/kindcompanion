# KindCompanion — AI-First Stack (Super Repo)

This repo is the single source of truth for the KindCompanion product:
- Branded landing + policies + press
- Redirects and security headers
- Netlify Function to generate Stripe Checkout sessions (phone collection ON)
- GitHub Action for auto-deploy to Netlify on each push
- Make.com automation blueprints and Stripe webhook script
- Consent-based analytics (Plausible + optional GA4)

## Environment (Netlify Site settings → Environment)
- STRIPE_SECRET_KEY
- STRIPE_PRICE_WEEKLY
- STRIPE_PRICE_MONTHLY
- SUCCESS_URL = https://kindcompanion.chat/thanks.html
- CANCEL_URL  = https://kindcompanion.chat/

## GitHub Secrets (Repo → Settings → Secrets → Actions)
- NETLIFY_AUTH_TOKEN
- NETLIFY_SITE_ID

## Shortlinks
- /join-weekly, /join-monthly → dynamic Stripe Checkout
- /start → WhatsApp deep link
- /privacy, /terms, /cookies, /press

— Last updated 2025-09-20 —
