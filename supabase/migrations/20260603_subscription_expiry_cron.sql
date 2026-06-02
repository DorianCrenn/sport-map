-- ────────────────────────────────────────────────────────────────────────────
-- Migration : Cron job pour les rappels d'expiration d'abonnement
-- Date      : 2026-06-03
--
-- Prérequis :
--   - Extension pg_cron activée dans Supabase (Dashboard > Database > Extensions)
--   - Extension pg_net activée (idem)
--   - Secret SUPABASE_SERVICE_ROLE_KEY configuré dans Vault ou env
--
-- Ce cron déclenche la Edge Function `subscription-expiration-reminder`
-- chaque jour à 8h00 UTC (9h ou 10h heure France selon DST).
--
-- IMPORTANT : Remplacer [PROJECT_REF] par votre référence de projet Supabase
-- (visible dans Settings > General, ex: "caikdkyrkrurjdlwrite")
-- ────────────────────────────────────────────────────────────────────────────

-- Supprimer le job s'il existe déjà (idempotent)
SELECT cron.unschedule('subscription-expiry-reminder')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'subscription-expiry-reminder'
);

-- Créer le cron job : tous les jours à 8h00 UTC
SELECT cron.schedule(
  'subscription-expiry-reminder',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://[PROJECT_REF].supabase.co/functions/v1/subscription-expiration-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Vérification
-- SELECT * FROM cron.job WHERE jobname = 'subscription-expiry-reminder';
