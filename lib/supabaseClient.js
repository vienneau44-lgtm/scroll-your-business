// Browser-safe client. Uses the public anon key — safe to expose,
// as long as Row Level Security policies are set up per sql/schema.sql.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
