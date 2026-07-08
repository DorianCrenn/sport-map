-- ============================================================
-- Migration 2026-07-08 : Invitation des joueurs/familles par email
-- Le club invite un joueur (via l'email de sa fiche) → l'utilisateur qui
-- accepte est AUTO-rattaché à sa fiche (le club a déjà autorisé via l'invite,
-- donc pas de validation manuelle du claim).
-- 100% additif : nouvelle table + RPC, aucune table existante modifiée.
-- ============================================================

CREATE TABLE IF NOT EXISTS player_invite_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  player_id   UUID NOT NULL REFERENCES club_players(id) ON DELETE CASCADE,
  club_id     UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_invite_token ON player_invite_tokens (token);
CREATE INDEX IF NOT EXISTS idx_player_invite_club ON player_invite_tokens (club_id);

ALTER TABLE player_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Les managers du club (et admins) gèrent leurs invitations.
-- sl_is_club_manager_for(text, text[]) : club_id en texte + rôles autorisés.
DROP POLICY IF EXISTS player_invite_admin ON player_invite_tokens;
CREATE POLICY player_invite_admin ON player_invite_tokens
  FOR ALL TO authenticated
  USING (sl_is_admin() OR sl_is_club_manager_for(club_id::text, ARRAY['owner','manager','editor']))
  WITH CHECK (sl_is_admin() OR sl_is_club_manager_for(club_id::text, ARRAY['owner','manager','editor']));

-- ── RPC d'acceptation ────────────────────────────────────────────────────────
-- L'utilisateur connecté échange un token valide contre le rattachement de sa
-- fiche joueur. SECURITY DEFINER car il écrit sur club_players qu'il ne possède
-- pas encore. Le token (envoyé à l'email de la fiche) fait office d'autorisation.
CREATE OR REPLACE FUNCTION accept_player_invite(p_token TEXT)
RETURNS TABLE (out_club_id UUID, out_club_name TEXT, out_player_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec player_invite_tokens%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT * INTO v_rec
  FROM player_invite_tokens
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation invalide ou expirée';
  END IF;

  -- Rattache la fiche à l'utilisateur (seulement si libre ou déjà à lui).
  UPDATE club_players
     SET user_id = auth.uid()
   WHERE id = v_rec.player_id
     AND (user_id IS NULL OR user_id = auth.uid());

  UPDATE player_invite_tokens
     SET accepted_at = NOW(), accepted_by = auth.uid()
   WHERE id = v_rec.id;

  RETURN QUERY
    SELECT c.id, c.name, cp.name
    FROM clubs c
    JOIN club_players cp ON cp.id = v_rec.player_id
    WHERE c.id = v_rec.club_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_player_invite(TEXT) TO authenticated;
