-- ============================================================
-- API rate limiting table
-- Used by Edge Functions to enforce per-user, per-endpoint limits.
-- Sliding window: count requests in the last `window_seconds` for a given key.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id          BIGSERIAL PRIMARY KEY,
  key         TEXT        NOT NULL,   -- e.g. "generate-variant-bg:user-uuid"
  endpoint    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS arl_key_created_idx ON public.api_rate_limits (key, created_at DESC);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct user access — only service role (Edge Functions)
-- No SELECT/INSERT/UPDATE/DELETE policies → effectively blocks all non-service-role access

-- Auto-cleanup: remove entries older than 1 hour to keep the table small.
-- Run via pg_cron (Supabase cron) or accept that rows accumulate until manual purge.
-- To enable pg_cron: Supabase Dashboard → Database → Extensions → pg_cron
-- SELECT cron.schedule('rate-limit-cleanup', '0 * * * *',
--   $$DELETE FROM public.api_rate_limits WHERE created_at < NOW() - INTERVAL '1 hour'$$);
