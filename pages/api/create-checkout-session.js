import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { FOUNDING_CAP, foundingPriceForCount } from '../../lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, tier, logoUrl } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Business name is required.' });
  }
  if (tier !== 'founding' && tier !== 'standard') {
    return res.status(400).json({ error: 'Invalid tier.' });
  }

  // Re-check availability and price server-side. Never trust a price sent
  // from the browser — someone could edit it before it reaches you.
  const { count: foundingCount } = await supabaseAdmin
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'founding');

  let finalTier = tier;
  let price;

  if (tier === 'founding') {
    if ((foundingCount || 0) >= FOUNDING_CAP) {
      // Founding sold out between page load and checkout — fall back gracefully.
      finalTier = 'standard';
      price = 10;
    } else {
      price = foundingPriceForCount(foundingCount || 0);
    }
  } else {
    price = 10;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: price * 100,
          product_data: {
            name: `Scroll Your Business — ${finalTier === 'founding' ? 'Founding' : 'Standard'} spot`,
            description: name.trim(),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      name: name.trim(),
      tier: finalTier,
      price: String(price),
      logoUrl: logoUrl || '',
    },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/claim`,
  });

  res.status(200).json({ url: session.url });
}
