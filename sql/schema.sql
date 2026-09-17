-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null check (tier in ('founding', 'standard')),
  price integer not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Row Level Security: anyone can read the scroll, but only the server
-- (using the service role key, from the Stripe webhook) can insert rows.
-- This means a claim only ever appears after payment actually succeeds.
alter table claims enable row level security;

create policy "Public can read claims"
  on claims for select
  using (true);

-- Intentionally no insert/update/delete policy for the public (anon) role.
-- Inserts happen only via lib/supabaseAdmin.js in pages/api/stripe-webhook.js.

-- ---------------------------------------------------------------------
-- Storage bucket for logos:
-- 1. Go to Storage > Create a new bucket.
-- 2. Name it exactly: logos
-- 3. Mark it "Public" (this alone makes reads work — no SELECT policy needed).
-- 4. Run the policy below so the anon (browser) client can upload logos
--    during the claim form, before payment completes.

create policy "Public can upload logos"
on storage.objects
for insert
to anon
with check (bucket_id = 'logos');
