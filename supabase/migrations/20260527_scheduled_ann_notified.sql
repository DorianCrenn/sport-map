-- Track whether a scheduled announcement has been push-notified
ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS notified_at timestamptz DEFAULT NULL;

-- Index for the cron query: find unnotified scheduled announcements that are now due
CREATE INDEX IF NOT EXISTS idx_club_announcements_cron
  ON public.club_announcements (scheduled_for, notified_at)
  WHERE scheduled_for IS NOT NULL AND notified_at IS NULL;

-- pg_cron setup (requires pg_cron + pg_net extensions enabled in Dashboard → Extensions)
-- Uncomment and run manually after enabling extensions:
--
-- SELECT cron.schedule(
--   'process-scheduled-announcements',
--   '*/15 * * * *',
--   $$
--     SELECT net.http_post(
--       url      := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-announcements',
--       headers  := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--         'Content-Type', 'application/json'
--       ),
--       body     := '{}'::jsonb
--     ) AS request_id;
--   $$
-- );
