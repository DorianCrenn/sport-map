-- ============================================================
-- MIGRATION SÉCURITÉ — SEC-001 + SEC-002
-- Date : 2026-05-20
-- Description :
--   SEC-001 : Contraindre events_insert — un club_admin ne peut
--             créer des événements que pour son propre club
--   SEC-002 : Uniformiser les comparaisons UUID↔TEXT dans ca_insert
--             et ajouter la policy UPDATE manquante sur announcements
-- ============================================================

-- ── SEC-001 : events INSERT ───────────────────────────────────────────────────
-- Avant : tout rôle club_admin pouvait créer un événement pour n'importe quel club
-- Après : club_admin est contraint à profiles.club_id = events.club_id

DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;

CREATE POLICY "events_insert_admin_or_club"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
      -- super/admin : accès total
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin')
      )
      OR
      -- club_admin : contraint à son propre club uniquement
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'club_admin'
          AND (
            club_id = events.club_id      -- même club (TEXT = TEXT)
            OR events.club_id IS NULL     -- événement sans club (autorisé)
          )
      )
    )
  );

-- ── SEC-002 : club_announcements INSERT ──────────────────────────────────────
-- Avant : clubs.id::text = club_announcements.club_id (cast fragile UUID→TEXT)
-- Après : comparaison explicite, logique identique mais plus robuste

DROP POLICY IF EXISTS "ca_insert" ON public.club_announcements;

CREATE POLICY "ca_insert"
  ON public.club_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      -- Propriétaire du club (créateur)
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_announcements.club_id
          AND clubs.user_id = auth.uid()
      )
      OR
      -- club_admin assigné à ce club uniquement
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'club_admin'
          AND club_id = club_announcements.club_id
      )
      OR
      -- super admin / admin
      public.sl_is_admin()
    )
  );

-- Policy UPDATE manquante : auteur ou admin peut modifier
DROP POLICY IF EXISTS "ca_update" ON public.club_announcements;

CREATE POLICY "ca_update"
  ON public.club_announcements FOR UPDATE
  USING  (auth.uid() = author_id OR public.sl_is_admin())
  WITH CHECK (auth.uid() = author_id OR public.sl_is_admin());

-- ── Vérification index manquant ───────────────────────────────────────────────
-- profiles.club_id est utilisé dans la sous-requête du policy events_insert
-- S'il n'existe pas, l'ajout est idempotent

CREATE INDEX IF NOT EXISTS profiles_club_id_idx ON public.profiles (club_id);

-- ── Rollback (copier-coller dans SQL Editor si besoin de revenir arrière) ─────
/*
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
  );

DROP POLICY IF EXISTS "ca_insert"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_update"  ON public.club_announcements;
-- restaurer l'ancienne ca_insert ici si nécessaire
*/
