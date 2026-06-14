-- ============================================================
-- SportLink — Audit sécurité & données fantômes (2026-06-14)
-- Idempotent : safe to re-run.
-- ============================================================

-- ── 1. club_page_views SELECT : restreindre au propriétaire du club ou admin ──
-- Avant : USING (true) → n'importe qui peut lire les vues de tous les clubs
-- Après : seul le propriétaire du club ou un admin peut lire les vues

DROP POLICY IF EXISTS "cpv_select_all"   ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_select_owner" ON public.club_page_views;

CREATE POLICY "cpv_select_owner"
  ON public.club_page_views FOR SELECT
  USING (
    public.sl_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_page_views.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Managers du club peuvent aussi voir les analytics
    OR public.sl_is_club_manager_for(club_page_views.club_id, ARRAY['manager', 'editor', 'communicant'])
  );

-- ── 2. club_page_views : forcer user_id = auth.uid() à l'INSERT ──────────────
-- Empêche un utilisateur de spoofer un autre user_id dans les analytics

DROP POLICY IF EXISTS "cpv_insert_anyone" ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_insert_auth"   ON public.club_page_views;

CREATE POLICY "cpv_insert_auth"
  ON public.club_page_views FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- ── 3. Guard trigger : forcer user_id à auth.uid() lors de l'INSERT ──────────
CREATE OR REPLACE FUNCTION public.club_page_views_set_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cpv_set_user_id ON public.club_page_views;
CREATE TRIGGER cpv_set_user_id
  BEFORE INSERT ON public.club_page_views
  FOR EACH ROW EXECUTE FUNCTION public.club_page_views_set_user_id();

-- ── 4. Nettoyage des annonces programmées expirées (données fantômes) ─────────
-- Les annonces dont scheduled_for est passé depuis > 7 jours et notified = false
-- sont des données mortes — la cron n'a pas pu les traiter.
-- On les marque notified = true pour éviter qu'elles re-triggent si la cron est relancée.

UPDATE public.club_announcements
SET notified_at = NOW()
WHERE scheduled_for IS NOT NULL
  AND scheduled_for < NOW() - INTERVAL '7 days'
  AND notified_at IS NULL;

-- ── 5. Nettoyage des push_subscriptions expirées ─────────────────────────────
-- Les souscriptions dont l'endpoint n'existe plus (410 Gone envoyé par le serveur push)
-- restent en DB jusqu'à la prochaine tentative d'envoi.
-- Ajouter une colonne expires_at pour permettre l'expiration proactive.

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_count    INTEGER NOT NULL DEFAULT 0;

-- Index pour identifier rapidement les abonnements défaillants
CREATE INDEX IF NOT EXISTS idx_push_subs_failure
  ON public.push_subscriptions(failure_count)
  WHERE failure_count > 0;

-- ── 6. Nettoyage des posters drafts orphelins ─────────────────────────────────
-- Les drafts (status='draft') liés à des events supprimés sont des données fantômes.
-- On ne peut pas ajouter de FK sur event_id (TEXT) directement, mais on peut
-- nettoyer périodiquement via une fonction RPC.

CREATE OR REPLACE FUNCTION public.cleanup_orphan_poster_drafts()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM public.posters
  WHERE status = 'draft'
    AND updated_at < NOW() - INTERVAL '30 days'
    AND event_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.events WHERE id::text = posters.event_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 7. Index pour accélérer les lookups RLS fréquents ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_clubs_user_id
  ON public.clubs(user_id);

CREATE INDEX IF NOT EXISTS idx_events_club_user
  ON public.events(club_id, user_id);

CREATE INDEX IF NOT EXISTS idx_club_announcements_scheduled
  ON public.club_announcements(scheduled_for)
  WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rides_event_status
  ON public.rides(event_id, status);

-- ── 8. Guard : profils sans nom (données fantômes post-signup) ────────────────
-- Certains profils créés via le fallback AuthContext n'ont pas de nom
UPDATE public.profiles
SET name = split_part(
    (SELECT email FROM auth.users WHERE auth.users.id = profiles.id),
    '@', 1
  )
WHERE (name IS NULL OR name = '')
  AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id);

-- ── 9. Vérification RLS activé sur toutes les tables sensibles ───────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'profiles','events','favorites','attendees','clubs','club_pages',
    'club_managers','club_trainings','club_page_views','club_announcements',
    'rides','ride_requests','ride_notifications','push_subscriptions',
    'poster_exports','posters','club_ai_usage','club_brand_kits','club_sponsors',
    'featured_events','event_comments','event_reactions','event_photos',
    'club_media_assets','app_feedback','feedback_votes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
        AND rowsecurity = false
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS activé sur %', t;
    END IF;
  END LOOP;
END;
$$;
