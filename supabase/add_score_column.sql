-- Migration : ajout de la colonne score sur la table events
-- Exécuter dans Supabase Dashboard → SQL Editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS score JSONB DEFAULT NULL;

-- Commentaire : score est un objet { "home": 2, "away": 1 } ou null si pas encore saisi
