import { createClient } from '@supabase/supabase-js';

const DIRECT_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const KEY        = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder';

// In production, route through the app's own domain to bypass ad blockers.
// vercel.json rewrites /sb-api/* → https://caikdkyrkrurjdlwrite.supabase.co/*
const clientUrl = import.meta.env.PROD
  ? `${window.location.origin}/sb-api`
  : DIRECT_URL;

export const supabase = createClient(clientUrl, KEY);
