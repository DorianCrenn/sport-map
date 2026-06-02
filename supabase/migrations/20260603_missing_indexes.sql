-- SportLink — Index manquants identifiés à l'audit 2026-06-02
-- Ces index améliorent les performances des vérifications RLS et des requêtes fréquentes.

-- ── 1. club_managers(club_id) ──────────────────────────────────────────────────
-- Chaque vérification RLS sur club_pages/events fait un lookup sur club_managers.
-- L'index composite idx_club_managers_club_role (club_id, role) créé en 20260527
-- couvre déjà les lookups préfixés sur club_id. Vérifier avec EXPLAIN ANALYZE
-- avant d'appliquer — cet index peut être redondant si PostgreSQL utilise déjà
-- l'index composite en index scan.
CREATE INDEX IF NOT EXISTS idx_club_managers_club_id
  ON public.club_managers (club_id);

-- ── 2. event_comments(event_id, created_at DESC) ───────────────────────────────
-- useEventComments charge les commentaires triés par date (ORDER BY created_at DESC).
-- Sans cet index : full scan + sort à chaque chargement de thread de commentaires.
CREATE INDEX IF NOT EXISTS idx_event_comments_event_date
  ON public.event_comments (event_id, created_at DESC);

-- ── 3. training_attendance(user_id) ───────────────────────────────────────────
-- L'index existant ta_session couvre (session_id, status).
-- Les requêtes "historique de présence par joueur" filtrent sur user_id sans
-- bénéficier de l'index composite existant.
CREATE INDEX IF NOT EXISTS idx_training_attendance_user_id
  ON public.training_attendance (user_id);
