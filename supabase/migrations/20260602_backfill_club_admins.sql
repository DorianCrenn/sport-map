-- Backfill : relier les créateurs de clubs existants à leur profil.
-- Le trigger on_club_created ne couvre que les nouveaux clubs.
-- Ce script corrige tous les profils encore à role='user' qui ont créé un club.

UPDATE public.profiles p
SET
  role    = 'club_admin',
  club_id = c.id
FROM public.clubs c
WHERE c.user_id = p.id
  AND p.role    = 'user'
  AND p.club_id IS NULL;
