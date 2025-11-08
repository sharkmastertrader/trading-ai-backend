import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import getRawBody from 'raw-body';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// regular JSON for all routes EXCEPT the webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') return next();
  express.json()(req, res, next);
});
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// 1) Create a checkout session (recurring subscription)
app.post('/api/checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/app?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 2) Lightweight “gate” endpoint: returns active status
app.get('/api/subscription-status', async (req, res) => {
  try {
    const { session_id, customer_id } = req.query;
    let customer = customer_id;

    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      customer = session.customer;
    }
    if (!customer) return res.json({ active: false });

    const subs = await stripe.subscriptions.list({ customer, status: 'all', limit: 1 });
    const active = subs.data.some(s => ['active', 'trialing', 'past_due'].includes(s.status));
    res.json({ active });
  } catch (e) {
    res.json({ active: false });
  }
});

// 3) Stripe webhook
app.post('/webhook', async (req, res) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    const raw = await getRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log('Stripe event:', event.type);
  res.json({ received: true });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
