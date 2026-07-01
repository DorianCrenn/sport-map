-- TEAM-FILTER-001 — Associer un coach à son équipe/catégorie
-- team_filter NULL = voit tous les matchs du club (président, communicant, owner)
-- team_filter 'Senior A' = voit uniquement les matchs où team_name='Senior A' OU category='Senior A'

ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS team_filter TEXT;

COMMENT ON COLUMN public.club_managers.team_filter IS
  'Filtre équipe/catégorie pour les coaches. NULL = accès à tous les matchs du club.';
