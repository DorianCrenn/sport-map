-- ============================================================
-- Migration: Add missing columns to events table
-- These columns exist in 01_schema.sql but were never applied
-- to the production database (schema cache error: PGRST204)
-- ============================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adversaire   TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cup_type     TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS standings    JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS score        JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS home_or_away TEXT DEFAULT 'home';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_name    TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS level        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'user';

-- After running this, reload PostgREST schema cache in Supabase Dashboard → API → Reload schema
