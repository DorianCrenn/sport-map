-- ROSTER-001 — Effectifs joueurs, tuteurs, demandes de rattachement, birth_year profil
-- Run in Supabase Dashboard → SQL Editor

-- ── club_players ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS club_players (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    text NOT NULL,
  team_id    text,                                        -- category.id dans clubs.categories
  name       text NOT NULL,
  number     smallint,                                    -- numéro de maillot
  position   text,                                        -- Gardien, Défenseur, Milieu, Attaquant
  photo_url  text,
  email      text,                                        -- optionnel, pour invitation directe
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- joueur adulte lié
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_players_club_team
  ON club_players(club_id, team_id, is_active);

CREATE INDEX IF NOT EXISTS club_players_user
  ON club_players(user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE club_players ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page club publique, dropdown MOTM)
CREATE POLICY "cp_select_public"
  ON club_players FOR SELECT
  USING (true);

-- Insert/Update/Delete : propriétaire du club, club_admin du profil, manager, ou admin
CREATE POLICY "cp_insert_manager"
  ON club_players FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = club_players.club_id OR role IN ('admin','superadmin')))
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager','editor'])
  );

CREATE POLICY "cp_update_manager"
  ON club_players FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = club_players.club_id OR role IN ('admin','superadmin')))
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager','editor'])
  );

CREATE POLICY "cp_delete_manager"
  ON club_players FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin') AND (club_id = club_players.club_id OR role IN ('admin','superadmin')))
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager'])
  );

-- ── player_guardians ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_guardians (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id  uuid REFERENCES club_players(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  relation   text,                                        -- 'Père', 'Mère', 'Tuteur légal'
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, user_id)
);

ALTER TABLE player_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pg_select_own"
  ON player_guardians FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.club_players cp
      WHERE cp.id = player_id
      AND (
        EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = cp.club_id AND clubs.user_id = auth.uid())
        OR public.sl_is_club_manager_for(cp.club_id, ARRAY['manager','editor'])
        OR public.sl_is_admin()
      )
    )
  );

CREATE POLICY "pg_insert_own"
  ON player_guardians FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pg_delete_own"
  ON player_guardians FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- ── player_claim_requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_claim_requests (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id  uuid REFERENCES club_players(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('player','guardian')),
  relation   text,                                        -- rempli si type = 'guardian'
  birth_year smallint,                                    -- demandé au moment du claim
  status     text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, user_id)
);

ALTER TABLE player_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pcr_select_involved"
  ON player_claim_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.club_players cp
      WHERE cp.id = player_id
      AND (
        EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = cp.club_id AND clubs.user_id = auth.uid())
        OR public.sl_is_club_manager_for(cp.club_id, ARRAY['manager'])
        OR public.sl_is_admin()
      )
    )
  );

CREATE POLICY "pcr_insert_own"
  ON player_claim_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pcr_update_manager"
  ON player_claim_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_players cp
      WHERE cp.id = player_id
      AND (
        EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id::text = cp.club_id AND clubs.user_id = auth.uid())
        OR public.sl_is_club_manager_for(cp.club_id, ARRAY['manager'])
        OR public.sl_is_admin()
      )
    )
  );

-- ── profiles.birth_year ───────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year smallint;

-- ── Auto-assign user_id when claim is approved (trigger) ─────────────────────

CREATE OR REPLACE FUNCTION handle_claim_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    IF NEW.type = 'player' THEN
      UPDATE public.club_players SET user_id = NEW.user_id WHERE id = NEW.player_id AND user_id IS NULL;
      -- Store birth_year on profile if provided
      IF NEW.birth_year IS NOT NULL THEN
        UPDATE public.profiles SET birth_year = NEW.birth_year WHERE id = NEW.user_id AND birth_year IS NULL;
      END IF;
    ELSIF NEW.type = 'guardian' THEN
      INSERT INTO public.player_guardians(player_id, user_id, relation)
        VALUES (NEW.player_id, NEW.user_id, NEW.relation)
        ON CONFLICT (player_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_claim_approval ON player_claim_requests;
CREATE TRIGGER trg_claim_approval
  AFTER UPDATE ON player_claim_requests
  FOR EACH ROW EXECUTE FUNCTION handle_claim_approval();

-- ── Auto-assign user_id when player email matches a new login (done in app) ───
-- See AuthContext.jsx for the client-side check on login
