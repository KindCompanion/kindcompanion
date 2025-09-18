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
