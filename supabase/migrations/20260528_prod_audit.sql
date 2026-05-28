-- ── Audit pré-production — index + CHECK constraint ─────────────────────────
--
-- NOTE : Les FK club_id → clubs(id) ne peuvent pas être ajoutées en l'état :
-- club_id est stocké en TEXT dans ces tables alors que clubs.id est UUID.
-- PostgreSQL refuse un FK entre types incompatibles sans conversion préalable.
-- La conversion TEXT → UUID de toutes ces colonnes est une refactorisation
-- hors scope ici (nécessite une migration avec downtime et mise à jour du code).

-- ── Index club_pages(club_id) ─────────────────────────────────────────────────
-- useClubPage.js filtre par club_id à chaque chargement de page club
CREATE INDEX IF NOT EXISTS idx_club_pages_club_id
  ON public.club_pages(club_id);

-- ── Index club_page_views(user_id, viewed_at) ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_club_page_views_user
  ON public.club_page_views(user_id, viewed_at DESC);

-- ── CHECK profiles.role — enforce les valeurs valides ─────────────────────────
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_role
  CHECK (role IN ('user', 'admin', 'superadmin', 'club_admin'));
