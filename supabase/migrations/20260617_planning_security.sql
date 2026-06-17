-- ============================================================
-- SportLink — Planning sécurité + vue match_attendance_counts
-- Idempotent : safe to re-run.
-- ============================================================

-- ── 1. training_sessions SELECT : exiger auth (était public) ─────────────────
DROP POLICY IF EXISTS "ts_select_public" ON public.training_sessions;
CREATE POLICY "ts_select_auth"
  ON public.training_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 2. training_attendance SELECT : soi-même OU staff du club ────────────────
-- Avant : USING (true) → n'importe qui lisait TOUTES les présences
DROP POLICY IF EXISTS "ta_select_public" ON public.training_attendance;
CREATE POLICY "ta_select_involved"
  ON public.training_attendance FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_attendance.session_id
        AND (
          EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = ts.club_id AND clubs.user_id = auth.uid())
          OR public.sl_is_admin()
          OR public.sl_is_club_manager_for(ts.club_id, ARRAY['manager','editor','communicant'])
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','club_admin')
              AND (club_id = ts.club_id OR role IN ('admin','superadmin'))
          )
        )
    )
  );

-- ── 3. training_messages SELECT : exiger auth (était public) ─────────────────
-- Messages internes coaches ne doivent pas être publics
DROP POLICY IF EXISTS "tm_select_public" ON public.training_messages;
CREATE POLICY "tm_select_auth"
  ON public.training_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 4. training_attendance_counts : passer en SECURITY DEFINER ───────────────
-- La vue agrégée doit contourner RLS pour retourner des compteurs vrais
-- même aux joueurs qui ne voient que leur propre ligne dans training_attendance
DROP VIEW IF EXISTS public.training_attendance_counts;
CREATE VIEW public.training_attendance_counts
  WITH (security_invoker = false)
AS
SELECT
  session_id,
  COUNT(*) FILTER (WHERE status = 'present') AS present_count,
  COUNT(*) FILTER (WHERE status = 'absent')  AS absent_count,
  COUNT(*) FILTER (WHERE status = 'unsure')  AS unsure_count,
  COUNT(*)                                   AS total_count
FROM public.training_attendance
GROUP BY session_id;

GRANT SELECT ON public.training_attendance_counts TO authenticated, anon;

-- ── 5. match_player_attendance SELECT : soi-même OU staff du club ────────────
-- Avant : auth.uid() IS NOT NULL → tout utilisateur auth voyait toutes les présences
DROP POLICY IF EXISTS "mpa_select" ON public.match_player_attendance;
CREATE POLICY "mpa_select_involved"
  ON public.match_player_attendance FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = match_player_attendance.event_id
        AND (
          EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = e.club_id::text AND clubs.user_id = auth.uid())
          OR public.sl_is_admin()
          OR public.sl_is_club_manager_for(e.club_id::text, ARRAY['manager','editor','communicant'])
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','superadmin','club_admin')
              AND (club_id::text = e.club_id::text OR role IN ('admin','superadmin'))
          )
        )
    )
  );

-- ── 6. match_attendance_counts : vue agrégée SECURITY DEFINER ────────────────
DROP VIEW IF EXISTS public.match_attendance_counts;
CREATE VIEW public.match_attendance_counts
  WITH (security_invoker = false)
AS
SELECT
  event_id,
  COUNT(*) FILTER (WHERE status = 'present') AS present_count,
  COUNT(*) FILTER (WHERE status = 'absent')  AS absent_count,
  COUNT(*) FILTER (WHERE status = 'unsure')  AS unsure_count,
  COUNT(*)                                   AS total_count
FROM public.match_player_attendance
GROUP BY event_id;

GRANT SELECT ON public.match_attendance_counts TO authenticated, anon;

-- ── 7. event_convocations SELECT : joueur/tuteur/staff uniquement ─────────────
-- Avant : tout utilisateur authentifié voyait toutes les convocations
DROP POLICY IF EXISTS "ec_select" ON public.event_convocations;
CREATE POLICY "ec_select_involved"
  ON public.event_convocations FOR SELECT TO authenticated
  USING (
    public.sl_is_admin()
    -- Staff du club (propriétaire, manager, communicant)
    OR EXISTS (
      SELECT 1 FROM public.clubs c
      JOIN public.events e ON e.club_id::text = c.id::text
      WHERE e.id = event_convocations.event_id
        AND (
          c.user_id = auth.uid()
          OR public.sl_is_club_manager_for(c.id::text, ARRAY['manager','editor','communicant'])
        )
    )
    -- Joueur adulte directement lié
    OR EXISTS (
      SELECT 1 FROM public.club_players cp
      WHERE cp.id = event_convocations.player_id
        AND cp.user_id = auth.uid()
    )
    -- Parent / tuteur légal
    OR EXISTS (
      SELECT 1 FROM public.player_guardians pg
      WHERE pg.player_id = event_convocations.player_id
        AND pg.user_id = auth.uid()
    )
  );

-- ── 8. Index pour accélérer les nouvelles requêtes planning ──────────────────
CREATE INDEX IF NOT EXISTS idx_training_sessions_club_date
  ON public.training_sessions(club_id, date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_team_date
  ON public.training_sessions(team_id, date)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_att_session_user
  ON public.training_attendance(session_id, user_id);

CREATE INDEX IF NOT EXISTS idx_match_att_event_user
  ON public.match_player_attendance(event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_events_club_date
  ON public.events(club_id, date)
  WHERE is_archived = false;
