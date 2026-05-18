-- ============================================================
-- SportLink — Annonces clubs → abonnés
-- Prérequis : 01_schema.sql + 02_rls.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.club_announcements (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id      TEXT        NOT NULL,
  club_name    TEXT        NOT NULL DEFAULT '',
  author_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  TEXT        NOT NULL DEFAULT '',
  type         TEXT        NOT NULL DEFAULT 'info',
  title        TEXT,
  message      TEXT        NOT NULL,
  target_teams TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ca_type_check CHECK (type IN ('info','urgent','result','event'))
);

CREATE INDEX IF NOT EXISTS ca_club_created_idx ON public.club_announcements (club_id, created_at DESC);

ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_select"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_insert"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete"  ON public.club_announcements;

CREATE POLICY "ca_select"  ON public.club_announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ca_insert"  ON public.club_announcements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "ca_delete"  ON public.club_announcements FOR DELETE USING (auth.uid() = author_id OR public.sl_is_admin());

-- ── Reads tracking ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id UUID        NOT NULL REFERENCES public.club_announcements(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ar_select_own" ON public.announcement_reads;
DROP POLICY IF EXISTS "ar_insert_own" ON public.announcement_reads;
DROP POLICY IF EXISTS "ar_delete_own" ON public.announcement_reads;

CREATE POLICY "ar_select_own" ON public.announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ar_insert_own" ON public.announcement_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ar_delete_own" ON public.announcement_reads FOR DELETE USING (auth.uid() = user_id);
