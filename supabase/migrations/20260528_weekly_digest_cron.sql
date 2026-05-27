-- DIGEST-001 — pg_cron job pour l'envoi automatique du digest hebdomadaire
-- Requiert l'extension pg_cron activée dans Supabase (Dashboard → Database → Extensions)
-- Et RESEND_API_KEY configuré dans les secrets Edge Functions
-- Run in Supabase Dashboard → SQL Editor

SELECT cron.schedule(
  'weekly-digest-friday',
  '0 8 * * 5',   -- vendredi à 8h UTC
  $$
  SELECT net.http_post(
    url     := (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_ANON_KEY')
    ),
    body    := '{}'::jsonb
  );
  $$
);
