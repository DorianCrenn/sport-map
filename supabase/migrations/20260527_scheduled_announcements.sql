-- PROG-001a : annonces programmées
-- Ajout d'une colonne nullable `scheduled_for` sur club_announcements.
-- NULL  = envoi immédiat (comportement existant inchangé)
-- value = l'annonce n'est visible des abonnés qu'à partir de cette date/heure

ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz DEFAULT NULL;

-- Index partiel pour le filtrage rapide des annonces programmées en attente
CREATE INDEX IF NOT EXISTS club_announcements_scheduled
  ON public.club_announcements(scheduled_for)
  WHERE scheduled_for IS NOT NULL;
