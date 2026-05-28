-- Fix : ajoute la FK manquante entre featured_events.club_id et clubs(id)
-- Sans cette contrainte, PostgREST ne peut pas résoudre le join clubs:club_id(name)
-- et retourne 400 Bad Request sur la requête du feed "À la Une".

ALTER TABLE featured_events
  ADD CONSTRAINT fk_featured_events_club
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;

-- Après avoir appliqué cette migration :
-- Dashboard Supabase → API → Reload schema cache
