-- ============================================================
-- Migration 2026-06-21 : Stripe Integration
-- Colonne plan + subscription_expires_at sur clubs
-- (club_subscriptions déjà créée en 20260601)
-- ============================================================

-- S'assurer que clubs a les colonnes nécessaires pour le plan
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'
    CHECK (plan IN ('free','starter','premium','pro','elite')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour lookup rapide plan
CREATE INDEX IF NOT EXISTS idx_clubs_plan ON clubs (plan);

-- Webhook events log (optionnel — debug)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT UNIQUE NOT NULL,
  event_type  TEXT NOT NULL,
  club_id     TEXT,
  processed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_events_admin ON stripe_webhook_events
  FOR ALL TO authenticated
  USING (sl_is_admin());

COMMENT ON TABLE stripe_webhook_events IS 'Log des événements Stripe reçus par le webhook — pour debug et idempotence.';
