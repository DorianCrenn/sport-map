import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

window.__SB_URL = url;
if (!url || !key) {
  console.error('[Supabase] Variables manquantes.');
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder'
);

export const supabaseReady = !!url && !!key;
