import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[Supabase] Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes dans Vercel.');
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder'
);

export const supabaseReady = !!url && !!key;
