-- EQUIPES-001c : Archives saison
-- Ajoute is_archived sur events pour permettre la clôture de saison
-- Les events archivés sont exclus du feed principal mais restent en BDD

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Index partiel pour les events actifs (fetch principal)
CREATE INDEX IF NOT EXISTS idx_events_not_archived
  ON public.events (date ASC)
  WHERE is_archived = false;

-- La policy RLS SELECT existante (public) couvre déjà les events archivés.
-- Les club_admins peuvent archiver leurs propres events via UPDATE (couvert par la policy existante).
