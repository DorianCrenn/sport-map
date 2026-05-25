-- AUTO-001c — Champ "Joueur du match" sur les événements
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS man_of_match TEXT;
