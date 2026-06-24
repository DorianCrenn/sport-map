-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Sécuriser les tokens de convocation (C-01 audit 2026-06-23)
--
-- Problème : la policy RLS convoc_tokens_reply utilisait current_setting()
-- qui n'est pas positionnée lors d'appels REST directs → bypassable.
-- Solution : RPC SECURITY DEFINER qui encapsule la logique de réponse.
-- ─────────────────────────────────────────────────────────────────────────────

-- 0. Créer la table si 20260620_convocation_email.sql n'a pas encore été appliquée
--    (idempotent : ne fait rien si la table existe déjà)
CREATE TABLE IF NOT EXISTS convocation_reply_tokens (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token          TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  convocation_id UUID        NOT NULL REFERENCES event_convocations(id) ON DELETE CASCADE,
  player_email   TEXT        NOT NULL,
  player_name    TEXT,
  event_id       UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id        UUID        REFERENCES clubs(id) ON DELETE SET NULL,
  reply_status   TEXT        CHECK (reply_status IN ('accepted', 'declined', 'unavailable')),
  replied_at     TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_convoc_tokens_token       ON convocation_reply_tokens(token);
CREATE INDEX        IF NOT EXISTS idx_convoc_tokens_convocation ON convocation_reply_tokens(convocation_id);
ALTER TABLE convocation_reply_tokens ENABLE ROW LEVEL SECURITY;

-- 1. Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS convoc_tokens_read_anon        ON public.convocation_reply_tokens;
DROP POLICY IF EXISTS convoc_tokens_admin            ON public.convocation_reply_tokens;
DROP POLICY IF EXISTS convoc_tokens_no_direct_update ON public.convocation_reply_tokens;

-- 2. SELECT restreint : uniquement les tokens non expirés
--    La restriction "par token exact" est appliquée côté app via WHERE token=$token.
--    La RPC ci-dessous est la vraie protection pour l'écriture.
CREATE POLICY convoc_tokens_read_by_token
  ON public.convocation_reply_tokens
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > NOW());

-- Admins et managers du club peuvent tout voir
CREATE POLICY convoc_tokens_admin
  ON public.convocation_reply_tokens
  FOR ALL
  TO authenticated
  USING (
    sl_is_admin()
    OR sl_is_club_manager_for(club_id::text, ARRAY['owner','manager','editor','communicant'])
  );

-- 3. Supprimer la policy d'UPDATE directe (bypassable via REST anon)
DROP POLICY IF EXISTS convoc_tokens_reply           ON public.convocation_reply_tokens;
DROP POLICY IF EXISTS "convoc_tokens_update_anon"   ON public.convocation_reply_tokens;

-- 4. Interdire les UPDATE directs sur convocation_reply_tokens depuis le client
CREATE POLICY convoc_tokens_no_direct_update
  ON public.convocation_reply_tokens
  FOR UPDATE
  TO anon, authenticated
  USING (false);

-- 5. Créer la RPC SECURITY DEFINER pour répondre à une convocation via token
CREATE OR REPLACE FUNCTION public.reply_to_convocation_token(
  p_token      TEXT,
  p_status     TEXT
) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_row  convocation_reply_tokens%ROWTYPE;
BEGIN
  -- Validation du statut
  IF p_status NOT IN ('accepted', 'declined', 'unavailable') THEN
    RAISE EXCEPTION 'invalid_status: %', p_status;
  END IF;

  -- Récupérer le token valide et non déjà utilisé
  SELECT * INTO v_row
  FROM convocation_reply_tokens
  WHERE token = p_token
    AND expires_at > NOW()
    AND reply_status IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'token_invalid_or_expired';
  END IF;

  -- Mettre à jour le token
  UPDATE convocation_reply_tokens
  SET reply_status = p_status,
      replied_at   = NOW()
  WHERE id = v_row.id;

  -- Mettre à jour la convocation liée
  IF v_row.convocation_id IS NOT NULL THEN
    UPDATE event_convocations
    SET status = p_status
    WHERE id = v_row.convocation_id;
  END IF;

  RETURN jsonb_build_object(
    'ok',             true,
    'convocation_id', v_row.convocation_id,
    'event_id',       v_row.event_id,
    'player_name',    v_row.player_name
  );
END;
$$;

-- Donner accès à anon et authenticated (flux email = non-connecté)
GRANT EXECUTE ON FUNCTION public.reply_to_convocation_token(TEXT, TEXT) TO anon, authenticated;

-- 6. Activer pg_cron cleanup sur api_rate_limits (I-07 audit)
-- Décommenter si pg_cron est disponible en production :
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *',
--   $$ DELETE FROM public.api_rate_limits WHERE window_start < NOW() - INTERVAL '2 hours'; $$
-- );
