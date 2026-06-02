-- ────────────────────────────────────────────────────────────────────────────
-- Migration : Cron job pour les rappels d'expiration d'abonnement
-- Date      : 2026-06-03
--
-- Prérequis :
--   - Extension pg_cron activée (Dashboard → Database → Extensions)
--   - Extension pg_net activée (idem)
--   - Edge Function `subscription-expiration-reminder` déployée
--   - Secrets SUPABASE_URL + SUPABASE_ANON_KEY dans vault.secrets
--
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'subscription-expiry-reminder',
  '0 8 * * *',   -- tous les jours à 8h UTC (9h/10h heure France)
  $$
  SELECT net.http_post(
    url     := (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/subscription-expiration-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_ANON_KEY')
    ),
    body    := '{}'::jsonb
  );
  $$
);
