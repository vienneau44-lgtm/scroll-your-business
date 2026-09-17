# Scroll Your Business

A real, deployable version of the Scroll Your Business prototype — wired to
Supabase (live data + logo storage) and Stripe (real payment) instead of
Claude's in-chat storage.

## What this is

- `/` — the live scroll, a grid of logo cards in first-come-first-published
  order (both tiers mixed by actual claim time — founding spots are marked
  with a gold border, not pinned to the top).
- `/claim` — the registration flow: pick a tier, name your business, upload
  a logo, pay with Stripe.
- A spot only appears on the scroll **after Stripe confirms payment**, via
  a webhook — not the moment someone fills out the form. This avoids people
  claiming a spot without actually paying.
- Founding tier: first 100 spots are $50, the rest of the 1,000 are $100.
  Standard tier: $10, unlimited, forever.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the SQL Editor, run everything in `sql/schema.sql`.
3. Go to **Storage** and create a new bucket named exactly `logos`, marked
   **Public** (this alone makes reads public — no policy needed for that).
   Then, back in the **SQL Editor**, run the `insert` policy at the bottom
   of `sql/schema.sql` so the anon client can upload logos.
4. Go to **Project Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret —
     never put it in a `NEXT_PUBLIC_` variable or client-side code)

## 2. Create a Stripe account

1. Go to [stripe.com](https://stripe.com) and create an account.
2. In **Developers > API keys**, copy your secret key into
   `STRIPE_SECRET_KEY`. Start with the **test** key while you're setting up.
3. You'll set up the webhook (step 5) after deploying, since Stripe needs a
   real URL to send events to.

## 3. Set your environment variables

Copy `.env.local.example` to `.env.local` and fill in everything from steps
1–2. For local testing, `NEXT_PUBLIC_SITE_URL` can stay as
`http://localhost:3000`.

## 4. Run it locally (optional, to test before deploying)

```
npm install
npm run dev
```

Visit `http://localhost:3000`. Note: the Stripe webhook won't fire locally
without the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe-webhook`)
— easiest to just test the full flow after deploying, using Stripe test mode.

## 5. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), import the repository.
3. Add all the environment variables from `.env.local` in Vercel's project
   settings (Settings > Environment Variables).
4. Deploy. You'll get a `*.vercel.app` URL.
5. Update `NEXT_PUBLIC_SITE_URL` to your real domain (see step 7) and
   redeploy once that's pointed correctly.

## 6. Connect the Stripe webhook

1. In Stripe, go to **Developers > Webhooks > Add endpoint**.
2. Endpoint URL: `https://scrollyourbusiness.com/api/stripe-webhook`
   (or your `*.vercel.app` URL while testing).
3. Select the event `checkout.session.completed`.
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET` in Vercel's
   environment variables, then redeploy.

## 7. Point your domain at Vercel

1. In Vercel, go to your project > **Settings > Domains** and add
   `scrollyourbusiness.com`.
2. Vercel will show you the exact DNS records to add.
3. In your domain registrar's DNS settings, add those records.
4. Wait for DNS to propagate (usually minutes, sometimes longer), then
   Vercel will show the domain as connected.

## 8. Go live

1. Switch your Stripe keys from test mode to live mode (`sk_live_...`) in
   Vercel's environment variables, and add a **second** webhook endpoint
   for live mode with its own signing secret.
2. Run one real, small test purchase yourself end to end.
3. Launch, following the marketing plan already put together.

## Notes on scale

- This setup comfortably handles thousands of entries. Supabase's free tier
  covers this project's likely traffic; Vercel's free tier does too.
- Logos are stored as real files in Supabase Storage (not embedded as text),
  so there's no practical limit on how many can be uploaded.
