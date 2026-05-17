import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In production, route through the app's own domain to bypass ad blockers.
// vercel.json rewrites /sb-api/* → Supabase project URL
const clientUrl = import.meta.env.PROD
  ? `${window.location.origin}/sb-api`
  : SUPABASE_URL;

export const supabase = createClient(clientUrl, SUPABASE_ANON_KEY);
