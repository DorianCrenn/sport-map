-- ── Étape 1 : Colonnes status + champs wizard sur la table clubs ──────────────

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('draft','pending_verification','verified','suspended','rejected')),
  ADD COLUMN IF NOT EXISTS verification_note  TEXT,
  ADD COLUMN IF NOT EXISTS verified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Identité
  ADD COLUMN IF NOT EXISTS sigle              TEXT,
  ADD COLUMN IF NOT EXISTS slogan             TEXT,
  ADD COLUMN IF NOT EXISTS founding_year      INTEGER,
  ADD COLUMN IF NOT EXISTS primary_color      TEXT DEFAULT '#22C55E',
  ADD COLUMN IF NOT EXISTS banner_url         TEXT,
  -- Localisation
  ADD COLUMN IF NOT EXISTS venue              TEXT,
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS postal_code        TEXT,
  ADD COLUMN IF NOT EXISTS region             TEXT,
  ADD COLUMN IF NOT EXISTS lat                DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng                DOUBLE PRECISION,
  -- Contact
  ADD COLUMN IF NOT EXISTS manager_name       TEXT,
  ADD COLUMN IF NOT EXISTS manager_function   TEXT,
  ADD COLUMN IF NOT EXISTS manager_phone      TEXT,
  -- Sport & effectif
  ADD COLUMN IF NOT EXISTS member_count       INTEGER,
  ADD COLUMN IF NOT EXISTS level              TEXT,
  -- Réseaux sociaux (complète les colonnes website/phone/email déjà présentes)
  ADD COLUMN IF NOT EXISTS facebook           TEXT,
  ADD COLUMN IF NOT EXISTS instagram          TEXT,
  ADD COLUMN IF NOT EXISTS tiktok             TEXT;

-- ── Étape 2 : Backfill — les clubs existants sont considérés comme vérifiés ──

UPDATE public.clubs
SET
  status      = 'verified',
  verified_at = created_at
WHERE created_at < NOW() - INTERVAL '1 minute';

-- ── Étape 3 : Table club_notifications (in-app) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_notifications (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  -- types : new_club_pending | club_created_confirm | club_verified |
  --         club_rejected | club_info_requested | club_suspended
  club_id    UUID        REFERENCES public.clubs(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.club_notifications ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres notifications
CREATE POLICY "club_notifs_select_own"
  ON public.club_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Chaque utilisateur peut marquer ses propres notifications comme lues
CREATE POLICY "club_notifs_update_own"
  ON public.club_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Les admins ET les edge functions (via service_role) peuvent insérer pour n'importe quel user
-- Les edge functions utilisent le service_role key → bypass RLS automatique
-- Ce policy couvre les insertions côté frontend si nécessaire
CREATE POLICY "club_notifs_insert_admin_or_self"
  ON public.club_notifications FOR INSERT TO authenticated
  WITH CHECK (public.sl_is_admin() OR user_id = auth.uid());

-- ── Étape 4 : Index de performance ────────────────────────────────────────

CREATE INDEX IF NOT EXISTS clubs_status_created_idx
  ON public.clubs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS club_notifs_user_read_idx
  ON public.club_notifications(user_id, read, created_at DESC);
