-- ============================================================
-- FIX-001 : club_managers SELECT policy — utiliser auth.email()
--   L'ancienne policy faisait SELECT FROM auth.users directement,
--   ce qui n'est pas autorisé pour le rôle authenticated.
--   auth.email() lit le JWT sans accès à auth.users.
--
-- FIX-002 : events.poster_url — ajouter la colonne manquante
--   useNewsFeed.js et useFeedItems.ts référencent poster_url
--   mais la colonne n'existait pas → 400 Bad Request PostgREST.
-- ============================================================

-- ── FIX-001 : club_managers ───────────────────────────────────────────────────

GRANT SELECT ON public.club_managers TO authenticated;

DROP POLICY IF EXISTS "managers_select_own_or_owner" ON public.club_managers;

CREATE POLICY "managers_select_own_or_owner"
  ON public.club_managers FOR SELECT
  USING (
    -- L'utilisateur voit ses propres lignes via auth.email() (pas de JOIN auth.users)
    lower(email) = lower(auth.email())
    -- Le propriétaire du club voit ses gestionnaires
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Les admins plateforme voient tout
    OR public.sl_is_admin()
  );

-- ── FIX-002 : events.poster_url ───────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS poster_url TEXT DEFAULT NULL;

-- Index léger pour les lookups éventuels (non null uniquement)
CREATE INDEX IF NOT EXISTS events_poster_url_idx
  ON public.events(id)
  WHERE poster_url IS NOT NULL;
