-- ── Audit pré-production — FK manquantes + index + CHECK constraint ──────────
-- À appliquer APRÈS avoir vérifié l'absence d'enregistrements orphelins :
--   SELECT COUNT(*) FROM club_managers   WHERE club_id NOT IN (SELECT id::text FROM clubs);
--   SELECT COUNT(*) FROM club_pages      WHERE club_id NOT IN (SELECT id::text FROM clubs);
--   SELECT COUNT(*) FROM club_page_views WHERE club_id NOT IN (SELECT id::text FROM clubs);
--   SELECT COUNT(*) FROM club_trainings  WHERE club_id NOT IN (SELECT id::text FROM clubs);
-- Si > 0, nettoyer d'abord :
--   DELETE FROM club_managers   WHERE club_id NOT IN (SELECT id::text FROM clubs);
--   etc.

-- ── FK club_managers → clubs ──────────────────────────────────────────────────
ALTER TABLE public.club_managers
  ADD CONSTRAINT fk_club_managers_club
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

-- ── FK club_pages → clubs ─────────────────────────────────────────────────────
ALTER TABLE public.club_pages
  ADD CONSTRAINT fk_club_pages_club
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

-- ── FK club_page_views → clubs ────────────────────────────────────────────────
ALTER TABLE public.club_page_views
  ADD CONSTRAINT fk_club_page_views_club
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

-- ── FK club_trainings → clubs ─────────────────────────────────────────────────
ALTER TABLE public.club_trainings
  ADD CONSTRAINT fk_club_trainings_club
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

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
