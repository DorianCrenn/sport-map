-- Add categories JSONB column to clubs table
-- Stores the club's team structure: [{ id, name, teams: [{ id, name, level, category }] }]
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS categories JSONB NOT NULL DEFAULT '[]';
