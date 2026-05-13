import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://caikdkyrkrurjdlwrite.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaWtka3lya3J1cmpkbHdyaXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTU3NTQsImV4cCI6MjA5NDE5MTc1NH0.34joetC3Vh4DrryJ2jUFvZPp8AMFCUoWBi6GVy2xrpA';

// In production, route through the app's own domain to bypass ad blockers.
// vercel.json rewrites /sb-api/* → https://caikdkyrkrurjdlwrite.supabase.co/*
const clientUrl = import.meta.env.PROD
  ? `${window.location.origin}/sb-api`
  : SUPABASE_URL;

export const supabase = createClient(clientUrl, SUPABASE_ANON_KEY);
