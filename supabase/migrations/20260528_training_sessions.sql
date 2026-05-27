-- TRAINING-001 — Séances concrètes, présences, messages
-- Run in Supabase Dashboard → SQL Editor

-- ── training_sessions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_sessions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id        text NOT NULL,
  team_id        text,
  session_ref_id text,          -- id de la session JSONB dans club_trainings (optionnel)
  date           date NOT NULL,
  time           text,          -- "18h00"
  location       text,
  status         text DEFAULT 'active' CHECK (status IN ('active','cancelled','rescheduled')),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ts_club_date ON training_sessions(club_id, date DESC);
CREATE INDEX IF NOT EXISTS ts_team_date ON training_sessions(club_id, team_id, date DESC);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde (membre du club ou public)
CREATE POLICY "ts_select_public" ON training_sessions FOR SELECT USING (true);

-- Écriture : propriétaire club, club_admin, manager
CREATE POLICY "ts_insert_manager"
  ON training_sessions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = training_sessions.club_id OR role IN ('admin','superadmin')))
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager','editor'])
  );

CREATE POLICY "ts_update_manager"
  ON training_sessions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = training_sessions.club_id OR role IN ('admin','superadmin')))
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager','editor'])
  );

CREATE POLICY "ts_delete_manager"
  ON training_sessions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager'])
  );

-- ── training_attendance ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_attendance (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id  uuid REFERENCES club_players(id) ON DELETE SET NULL, -- optionnel si joueur lié
  status     text NOT NULL CHECK (status IN ('present','absent','unsure')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS ta_session ON training_attendance(session_id, status);

ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

-- Lecture : managers voient tout, users voient les sessions de leurs clubs
CREATE POLICY "ta_select_public" ON training_attendance FOR SELECT USING (true);

-- Écriture : l'utilisateur gère sa propre réponse
CREATE POLICY "ta_insert_own"
  ON training_attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ta_update_own"
  ON training_attendance FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "ta_delete_own"
  ON training_attendance FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_training_attendance_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ta_updated_at ON training_attendance;
CREATE TRIGGER trg_ta_updated_at
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW EXECUTE FUNCTION update_training_attendance_updated_at();

-- Vue agrégée (count par séance + status)
CREATE OR REPLACE VIEW training_attendance_counts AS
SELECT
  session_id,
  COUNT(*) FILTER (WHERE status = 'present') AS present_count,
  COUNT(*) FILTER (WHERE status = 'absent')  AS absent_count,
  COUNT(*) FILTER (WHERE status = 'unsure')  AS unsure_count,
  COUNT(*)                                   AS total_count
FROM training_attendance
GROUP BY session_id;

-- ── training_messages ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  club_id    text NOT NULL,
  author_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content    text NOT NULL,
  type       text DEFAULT 'info' CHECK (type IN ('info','urgent','cancelled','rescheduled')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tm_session ON training_messages(session_id, created_at DESC);

ALTER TABLE training_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tm_select_public" ON training_messages FOR SELECT USING (true);

CREATE POLICY "tm_insert_manager"
  ON training_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = training_messages.club_id OR role IN ('admin','superadmin')))
      OR public.sl_is_club_manager_for(club_id, ARRAY['manager','communicant'])
    )
  );

CREATE POLICY "tm_delete_manager"
  ON training_messages FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager'])
  );
