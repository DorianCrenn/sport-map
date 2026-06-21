-- ============================================================
-- Migration 2026-06-20 : Convocations par email
-- Tokens pour réponse sans login obligatoire
-- ============================================================

-- Table des tokens de réponse convocation
CREATE TABLE IF NOT EXISTS convocation_reply_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  convocation_id UUID NOT NULL REFERENCES event_convocations(id) ON DELETE CASCADE,
  player_email   TEXT NOT NULL,
  player_name    TEXT,
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id        UUID REFERENCES clubs(id) ON DELETE SET NULL,
  -- Réponse enregistrée (null = pas encore répondu)
  reply_status   TEXT CHECK (reply_status IN ('accepted', 'declined', 'unavailable')),
  replied_at     TIMESTAMPTZ,
  -- Expiration 7 jours après l'envoi
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour lookup token rapide
CREATE UNIQUE INDEX IF NOT EXISTS idx_convoc_tokens_token
  ON convocation_reply_tokens (token);

CREATE INDEX IF NOT EXISTS idx_convoc_tokens_convocation
  ON convocation_reply_tokens (convocation_id);

-- Nettoyage automatique des tokens expirés (trigger ou cron externe)
-- Pour Supabase, utiliser pg_cron si disponible, sinon nettoyage à la demande

-- RLS : lecture/écriture via token (pas d'auth requise pour la réponse)
ALTER TABLE convocation_reply_tokens ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY convoc_tokens_admin ON convocation_reply_tokens
  FOR ALL TO authenticated
  USING (sl_is_admin() OR sl_is_club_manager_for(club_id));

-- Répondre via token : accessible sans auth (anon key)
CREATE POLICY convoc_tokens_reply ON convocation_reply_tokens
  FOR UPDATE TO anon, authenticated
  USING (token = current_setting('app.token', true) AND expires_at > NOW() AND reply_status IS NULL)
  WITH CHECK (reply_status IS NOT NULL);

-- Lire son token (pour la page de réponse)
CREATE POLICY convoc_tokens_read_anon ON convocation_reply_tokens
  FOR SELECT TO anon, authenticated
  USING (expires_at > NOW());

-- Colonne email_sent dans event_convocations pour tracking
ALTER TABLE event_convocations
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON TABLE convocation_reply_tokens IS 'Tokens pour répondre à une convocation par email sans login obligatoire. Expire après 7 jours.';
