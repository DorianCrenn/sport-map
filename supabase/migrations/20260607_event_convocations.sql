-- ─── Convocations formelles coach → joueur ──────────────────────────────────
-- Un coach convoque des joueurs pour un match. Les joueurs/tuteurs répondent.
-- Séparé de match_player_attendance (presence libre) : les convocations sont
-- une invitation formelle avec workflow de réponse.

CREATE TABLE IF NOT EXISTS event_convocations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id    uuid NOT NULL REFERENCES club_players(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','declined','unavailable')),
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (event_id, player_id)
);

CREATE INDEX IF NOT EXISTS ec_event_idx  ON event_convocations(event_id);
CREATE INDEX IF NOT EXISTS ec_player_idx ON event_convocations(player_id);
CREATE INDEX IF NOT EXISTS ec_status_idx ON event_convocations(event_id, status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trg_ec_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_ec_updated_at
  BEFORE UPDATE ON event_convocations
  FOR EACH ROW EXECUTE FUNCTION trg_ec_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE event_convocations ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut lire les convocations (nécessaire pour les
-- hooks côté joueur/parent qui vérifient les convocations par player_id)
CREATE POLICY ec_select ON event_convocations
  FOR SELECT TO authenticated USING (true);

-- Seul le propriétaire du club (via l'event) ou un admin peut gérer les convocations
CREATE POLICY ec_insert ON event_convocations
  FOR INSERT WITH CHECK (
    sl_is_admin()
    OR EXISTS (
      SELECT 1 FROM clubs c
      JOIN events e ON e.club_id::text = c.id::text
      WHERE e.id = event_id AND c.user_id = auth.uid()
    )
    OR sl_is_club_manager_for(
      (SELECT e.club_id FROM events e WHERE e.id = event_id),
      ARRAY['manager','editor']
    )
  );

CREATE POLICY ec_delete ON event_convocations
  FOR DELETE USING (
    sl_is_admin()
    OR EXISTS (
      SELECT 1 FROM clubs c
      JOIN events e ON e.club_id::text = c.id::text
      WHERE e.id = event_id AND c.user_id = auth.uid()
    )
  );

-- Les updates passent par la RPC respond_to_convocation (SECURITY DEFINER)
-- mais on autorise aussi le coach à mettre à jour directement
CREATE POLICY ec_update ON event_convocations
  FOR UPDATE USING (
    sl_is_admin()
    OR EXISTS (
      SELECT 1 FROM clubs c
      JOIN events e ON e.club_id::text = c.id::text
      WHERE e.id = event_id AND c.user_id = auth.uid()
    )
    -- Joueur ou tuteur peut mettre à jour le statut (via RPC ou directement)
    OR EXISTS (
      SELECT 1 FROM club_players cp WHERE cp.id = player_id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM player_guardians pg WHERE pg.player_id = player_id AND pg.user_id = auth.uid()
    )
  );

-- ─── RPC sécurisée : répondre à une convocation ──────────────────────────────
-- Valide côté serveur que l'uid est soit le joueur soit un tuteur légal.
-- Met aussi à jour match_player_attendance pour cohérence.

CREATE OR REPLACE FUNCTION respond_to_convocation(
  p_convocation_id uuid,
  p_status         text,
  p_note           text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_player_id uuid;
  v_event_id  uuid;
  v_attend    text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT player_id, event_id INTO v_player_id, v_event_id
  FROM event_convocations WHERE id = p_convocation_id;

  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'convocation_not_found';
  END IF;

  -- Vérifie autorisation : joueur direct OU tuteur légal
  IF NOT EXISTS (
    SELECT 1 FROM club_players WHERE id = v_player_id AND user_id = v_uid
    UNION ALL
    SELECT 1 FROM player_guardians WHERE player_id = v_player_id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Mise à jour de la convocation
  UPDATE event_convocations
  SET status       = p_status,
      note         = p_note,
      responded_by = v_uid,
      updated_at   = now()
  WHERE id = p_convocation_id;

  -- Synchronisation avec match_player_attendance
  v_attend := CASE p_status
    WHEN 'accepted'     THEN 'present'
    WHEN 'declined'     THEN 'absent'
    WHEN 'unavailable'  THEN 'absent'
    ELSE NULL
  END;

  IF v_attend IS NOT NULL THEN
    INSERT INTO match_player_attendance (event_id, user_id, status, updated_at)
    VALUES (v_event_id, v_uid, v_attend, now())
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET status = v_attend, updated_at = now();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_convocation TO authenticated;
