import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe to expose in client-side code by design.
// All tables are protected by Row Level Security and only readable/writable
// by authenticated users (see supabase/schema.sql).
const SUPABASE_URL = "https://qkrrqhrezyyklwezacst.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YDdVeYYWC_TPfdGDL5RWyw_e6JyN-Ll";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
