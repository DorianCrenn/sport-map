-- ============================================================
-- RLS Hardening — Filtrage par statut + protection status club
-- ============================================================

-- ── 1. clubs SELECT : masquer rejected/suspended/draft au public ──────────────
-- Avant : USING (true) → tous les clubs visibles quelle que soit leur statut
-- Après : rejected/suspended/draft = visibles uniquement par le propriétaire et admins

DROP POLICY IF EXISTS "clubs_select_public"         ON public.clubs;
DROP POLICY IF EXISTS "clubs_select_status_filtered" ON public.clubs;

CREATE POLICY "clubs_select_status_filtered"
  ON public.clubs FOR SELECT
  USING (
    -- Clubs actifs : vérifiés ou en attente de vérification → public
    status IN ('verified', 'pending_verification')
    -- Le propriétaire voit toujours son club (tous statuts)
    OR user_id = auth.uid()
    -- Les admins voient tout
    OR public.sl_is_admin()
  );

-- ── 2. Guard trigger : empêche un non-admin de modifier status/verified_at ────
-- Même si un club_admin fait un UPDATE direct via l'API Supabase, il ne
-- peut pas changer son propre statut de vérification.

CREATE OR REPLACE FUNCTION public.clubs_guard_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.sl_is_admin() THEN
    -- Restaurer les colonnes de vérification à leurs valeurs originales
    NEW.status            := OLD.status;
    NEW.verified_at       := OLD.verified_at;
    NEW.verified_by       := OLD.verified_by;
    NEW.verification_note := OLD.verification_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clubs_guard_status_trigger ON public.clubs;
CREATE TRIGGER clubs_guard_status_trigger
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.clubs_guard_status();

-- ── 3. events INSERT : ouvrir aux managers délégués (club_managers) ───────────
-- La policy actuelle n'inclut que le propriétaire du club (clubs.user_id).
-- On ajoute les managers avec rôles manager/editor.

DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;

CREATE POLICY "events_insert_admin_or_club"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'club_admin')
    )
    AND (
      club_id IS NULL
      OR public.sl_is_admin()
      -- Propriétaire du club
      OR EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_id
          AND clubs.user_id = auth.uid()
      )
      -- Manager délégué (manager ou editor)
      OR public.sl_is_club_manager_for(club_id, ARRAY['manager', 'editor'])
    )
  );

-- ── 4. Index pour améliorer les perfs du SELECT filtré par statut ─────────────
-- (déjà créé dans 20260603_club_status_and_fields.sql, idempotent)
CREATE INDEX IF NOT EXISTS clubs_status_user_idx
  ON public.clubs(status, user_id);

-- ── 5. Vérification : s'assurer que club_notifications a bien le RLS activé ───
ALTER TABLE IF EXISTS public.club_notifications ENABLE ROW LEVEL SECURITY;
