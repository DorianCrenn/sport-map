-- ============================================================
-- SportLink — Sprint 2026-05-27 — Migration consolidée
-- Toutes les nouvelles tables, colonnes, RLS et fonctions.
-- IDEMPOTENT : safe à re-run (IF NOT EXISTS / OR REPLACE partout).
-- Coller intégralement dans Supabase SQL Editor > Run.
--
-- Contenu :
--   1. ROLES-001      : Sous-rôles gestionnaires (manager/editor/communicant)
--   2. ROLES-001c     : Helper RLS + policies events / announcements / pages
--   3. ANALYTICS-001a : Table poster_exports + increment_ai_generate_count RPC
--   4. AI-COST-001a   : increment_ai_import_count RPC
--   5. PROG-001a      : Annonces programmées (scheduled_for + notified_at)
--   6. CONTENT-001a   : Table event_photos + RLS
--   7. PUSH-PROD-001a : events.reminder_sent_at
--   8. VIRAL-002d     : club_brand_kits.admin_notif_prefs
--   9. EQUIPES-001c   : events.is_archived + filtre fetch
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. ROLES-001 — Sous-rôles gestionnaires de club
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'manager';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'club_managers' AND constraint_name = 'club_managers_role_check'
  ) THEN
    ALTER TABLE public.club_managers
      ADD CONSTRAINT club_managers_role_check
      CHECK (role IN ('manager', 'editor', 'communicant'));
  END IF;
END $$;

UPDATE public.club_managers SET role = 'manager' WHERE role IS NULL OR role = '';

CREATE INDEX IF NOT EXISTS idx_club_managers_club_role
  ON public.club_managers (club_id, role);


-- ════════════════════════════════════════════════════════════
-- 2. ROLES-001c — Helper SECURITY DEFINER + RLS sub-rôles
-- ════════════════════════════════════════════════════════════

-- Vérifie si l'utilisateur courant est un gestionnaire du club avec l'un des rôles donnés.
-- Utilise join via auth.users.email car club_managers identifie par email (pas user_id).
CREATE OR REPLACE FUNCTION public.sl_is_club_manager_for(
  p_club_id TEXT,
  p_roles   TEXT[]
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.club_managers cm
    JOIN auth.users u ON lower(u.email) = lower(cm.email)
    WHERE cm.club_id = p_club_id
      AND u.id = auth.uid()
      AND cm.role = ANY(p_roles)
  );
END;
$$;

-- events — INSERT
DROP POLICY IF EXISTS "events_insert_admin_or_club"    ON public.events;
DROP POLICY IF EXISTS "events_insert_or_manager"       ON public.events;

CREATE POLICY "events_insert_or_manager"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin', 'club_admin')
      )
      OR (
        club_id IS NOT NULL
        AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager', 'editor'])
      )
    )
  );

-- events — UPDATE
DROP POLICY IF EXISTS "events_update_own_or_admin"     ON public.events;
DROP POLICY IF EXISTS "events_update_own_admin_mgr"    ON public.events;

CREATE POLICY "events_update_own_admin_mgr"
  ON public.events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager', 'editor'])
    )
  );

-- events — DELETE
DROP POLICY IF EXISTS "events_delete_own_or_admin"     ON public.events;
DROP POLICY IF EXISTS "events_delete_own_admin_mgr"    ON public.events;

CREATE POLICY "events_delete_own_admin_mgr"
  ON public.events FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager'])
    )
  );

-- club_announcements
DROP POLICY IF EXISTS "ca_insert"              ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete"              ON public.club_announcements;
DROP POLICY IF EXISTS "ca_insert_or_manager"   ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete_or_manager"   ON public.club_announcements;

CREATE POLICY "ca_insert_or_manager"
  ON public.club_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_announcements.club_id
          AND clubs.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'club_admin'
          AND club_id = club_announcements.club_id
      )
      OR public.sl_is_admin()
      OR public.sl_is_club_manager_for(club_announcements.club_id, ARRAY['manager', 'communicant'])
    )
  );

CREATE POLICY "ca_delete_or_manager"
  ON public.club_announcements FOR DELETE
  USING (
    auth.uid() = author_id
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager', 'communicant'])
  );

-- club_pages
DROP POLICY IF EXISTS "pages_insert_owner" ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner" ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner" ON public.club_pages;

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );


-- ════════════════════════════════════════════════════════════
-- 3. ANALYTICS-001a — Table poster_exports + RPC generate
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.poster_exports (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    uuid        REFERENCES public.clubs(id) ON DELETE SET NULL,
  event_id   text,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  format     text,
  channel    text        DEFAULT 'download',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poster_exports_club_month
  ON public.poster_exports (club_id, created_at DESC);

ALTER TABLE public.poster_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poster_exports_insert" ON public.poster_exports;
DROP POLICY IF EXISTS "poster_exports_select" ON public.poster_exports;

CREATE POLICY "poster_exports_insert" ON public.poster_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "poster_exports_select" ON public.poster_exports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION public.increment_ai_generate_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, generate_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET generate_count = club_ai_usage.generate_count + 1;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 4. AI-COST-001a — RPC increment_ai_import_count
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.increment_ai_import_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, import_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET import_count = club_ai_usage.import_count + 1;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 5. PROG-001a — Annonces programmées
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz DEFAULT NULL;

ALTER TABLE public.club_announcements
  ADD COLUMN IF NOT EXISTS notified_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS club_announcements_scheduled
  ON public.club_announcements (scheduled_for)
  WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_club_announcements_cron
  ON public.club_announcements (scheduled_for, notified_at)
  WHERE scheduled_for IS NOT NULL AND notified_at IS NULL;

-- pg_cron (décommenter et exécuter manuellement après activation des extensions pg_cron + pg_net) :
--
-- SELECT cron.schedule(
--   'process-scheduled-announcements', '*/15 * * * *',
--   $$SELECT net.http_post(
--       url     := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-announcements',
--       headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.settings.service_role_key'),'Content-Type','application/json'),
--       body    := '{}'::jsonb) AS request_id$$
-- );
--
-- SELECT cron.schedule('club-admin-reminders-morning', '0 8 * * *',
--   $$SELECT net.http_post(url:=current_setting('app.settings.supabase_url')||'/functions/v1/club-admin-reminders',
--     headers:=jsonb_build_object('Authorization','Bearer '||current_setting('app.settings.service_role_key'),'Content-Type','application/json'),
--     body:='{"check":"all"}'::jsonb)$$);
--
-- SELECT cron.schedule('club-admin-reminders-evening', '0 20 * * *',
--   $$SELECT net.http_post(url:=current_setting('app.settings.supabase_url')||'/functions/v1/club-admin-reminders',
--     headers:=jsonb_build_object('Authorization','Bearer '||current_setting('app.settings.service_role_key'),'Content-Type','application/json'),
--     body:='{"check":"post_match"}'::jsonb)$$);
--
-- SELECT cron.schedule('match-reminders', '*/30 * * * *',
--   $$SELECT net.http_post(url:=current_setting('app.settings.supabase_url')||'/functions/v1/match-reminders',
--     headers:=jsonb_build_object('Authorization','Bearer '||current_setting('app.settings.service_role_key'),'Content-Type','application/json'),
--     body:='{}'::jsonb)$$);


-- ════════════════════════════════════════════════════════════
-- 6. CONTENT-001a — Table event_photos
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.event_photos (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id    TEXT        NOT NULL,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event ON public.event_photos (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_photos_club  ON public.event_photos (club_id, created_at DESC);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ep_select_public"    ON public.event_photos;
DROP POLICY IF EXISTS "ep_insert_club_owner" ON public.event_photos;
DROP POLICY IF EXISTS "ep_delete_own"        ON public.event_photos;

CREATE POLICY "ep_select_public"
  ON public.event_photos FOR SELECT USING (true);

CREATE POLICY "ep_insert_club_owner"
  ON public.event_photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = event_photos.club_id
          AND clubs.user_id = auth.uid()
      )
      OR public.sl_is_admin()
      OR public.sl_is_club_manager_for(event_photos.club_id, ARRAY['manager', 'editor'])
    )
  );

CREATE POLICY "ep_delete_own"
  ON public.event_photos FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());


-- Storage bucket (Dashboard → Storage → New bucket, ou via CLI) :
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true)
-- ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- 7. PUSH-PROD-001a — events.reminder_sent_at
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_events_reminder
  ON public.events (date, reminder_sent_at)
  WHERE reminder_sent_at IS NULL AND club_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════
-- 8. VIRAL-002d — club_brand_kits.admin_notif_prefs
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.club_brand_kits
  ADD COLUMN IF NOT EXISTS admin_notif_prefs JSONB
  NOT NULL
  DEFAULT '{"match_j1": true, "match_today": true, "post_match_score": true}'::jsonb;


-- ════════════════════════════════════════════════════════════
-- 9. EQUIPES-001c — events.is_archived
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_not_archived
  ON public.events (date ASC)
  WHERE is_archived = false;


-- ════════════════════════════════════════════════════════════
-- FIN — Déploiement Edge Functions requis séparément :
--
--   supabase functions deploy send-push
--   supabase functions deploy notify-club-followers
--   supabase functions deploy match-reminders
--   supabase functions deploy club-admin-reminders
--   supabase functions deploy process-scheduled-announcements
--   supabase functions deploy generate-variant-bg
--   supabase functions deploy remove-background
--
-- Secrets Supabase à configurer (Dashboard → Edge Functions → Secrets) :
--   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
--   FAL_API_KEY, FAL_MONTHLY_LIMIT (défaut : 200)
--   REMOVEBG_API_KEY
-- ════════════════════════════════════════════════════════════
