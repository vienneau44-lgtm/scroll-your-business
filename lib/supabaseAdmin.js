// Server-only client. Uses the service role key, which bypasses Row Level
// Security — never import this file from client-side code or expose the key
// with a NEXT_PUBLIC_ prefix.
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
