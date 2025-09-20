// Netlify Function: create-checkout
// Creates Stripe Checkout sessions for weekly/monthly plans.
// Env vars required: STRIPE_SECRET_KEY, STRIPE_PRICE_WEEKLY, STRIPE_PRICE_MONTHLY, SUCCESS_URL, CANCEL_URL

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const plan = url.searchParams.get('plan') || 'monthly';

    const priceId = plan === 'weekly'
      ? process.env.STRIPE_PRICE_WEEKLY
      : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing price ID for plan '+plan }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_update: { address: 'auto', name: 'auto' },
      phone_number_collection: { enabled: true },
      success_url: process.env.SUCCESS_URL || 'https://kindcompanion.chat/thanks.html',
      cancel_url: process.env.CANCEL_URL || 'https://kindcompanion.chat/',
      metadata: { plan }
    });

    return {
      statusCode: 302,
      headers: { Location: session.url },
      body: ''
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error', detail: String(e) }) };
  }
};
