import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client (service-role key) for the subscribe route.
// Never import this into a client component. The `subscribers` table has RLS
// enabled with no policies, so only this key can read/write it.
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
