-- Migration : colonnes is_demo pour tagger les données de démonstration
-- Permet de proposer un espace de démo à la création du club et de le supprimer facilement

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- Partial indexes — performances sur les suppressions ciblées
CREATE INDEX IF NOT EXISTS events_is_demo_idx
  ON public.events(is_demo) WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS club_announcements_is_demo_idx
  ON public.club_announcements(is_demo) WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS rides_is_demo_idx
  ON public.rides(is_demo) WHERE is_demo = true;
