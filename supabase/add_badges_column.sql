-- SportLink — Ajout colonne badges sur profiles
-- Exécuter dans : Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
