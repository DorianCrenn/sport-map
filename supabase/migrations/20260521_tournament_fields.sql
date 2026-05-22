-- ============================================================
-- Migration: Add tournament-specific columns to events table
-- These columns hold tournament metadata (not needed for matches)
-- ============================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tournament_name       TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tournament_type       TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS num_teams             INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tournament_format     TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tournament_categories TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS prize                 TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer             TEXT;

-- After running this, reload PostgREST schema cache:
-- Supabase Dashboard → Settings → API → Reload schema
