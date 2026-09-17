import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe needs the raw request body to verify the webhook signature,
// so we turn off Next.js's automatic body parsing for this route.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { name, tier, price, logoUrl } = session.metadata;

    // This is the ONLY place a row gets written to the claims table —
    // meaning a spot only ever appears on the scroll after Stripe
    // confirms the payment actually went through.
    const { error } = await supabaseAdmin.from('claims').insert({
      name,
      tier,
      price: Number(price),
      logo_url: logoUrl || null,
    });

    if (error) {
      console.error('Failed to insert claim after payment:', error.message);
      // Still return 200 so Stripe doesn't keep retrying forever — but log
      // this loudly, since it means someone paid and isn't on the scroll yet.
    }
  }

  res.status(200).json({ received: true });
}
