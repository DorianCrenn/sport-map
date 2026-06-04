-- P0-SEC-001 : poster_exports SELECT — étendre aux managers du club
-- P0-SEC-002 : club_managers — ajouter user_id pour rendre RLS possible sans JOIN email

-- ── P0-SEC-001 : poster_exports SELECT ───────────────────────────────────────
-- La policy d'origine ne couvrait que le propriétaire du club (clubs.user_id)
-- et les admins, excluant les managers délégués.
-- On étend pour inclure :
--   • l'utilisateur qui a produit l'export (auth.uid() = user_id)
--   • les managers du club (tout rôle)

DROP POLICY IF EXISTS "poster_exports_select" ON public.poster_exports;

CREATE POLICY "poster_exports_select" ON public.poster_exports
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      club_id IS NOT NULL
      AND (
        EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND user_id = auth.uid())
        OR public.sl_is_club_manager_for(club_id::text, ARRAY['manager', 'editor', 'communicant'])
      )
    )
    OR public.sl_is_admin()
  );

-- ── P0-SEC-002 : club_managers.user_id ───────────────────────────────────────
-- La table identifie les managers par email, ce qui nécessite un JOIN sur
-- auth.users dans sl_is_club_manager_for — fragile si l'email change et
-- inefficace (seq scan sur auth.users).
-- On ajoute user_id pour une identification directe.

ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index pour les lookups directs (club_id, user_id)
CREATE INDEX IF NOT EXISTS club_managers_user_id_idx
  ON public.club_managers(user_id);
CREATE INDEX IF NOT EXISTS club_managers_club_user_idx
  ON public.club_managers(club_id, user_id);

-- Backfill : résolution email → user_id pour les lignes existantes
UPDATE public.club_managers cm
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(cm.email)
  AND cm.user_id IS NULL;

-- Trigger : résolution automatique à chaque INSERT ou modification d'email
CREATE OR REPLACE FUNCTION public.sl_club_managers_set_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS club_managers_set_user_id ON public.club_managers;
CREATE TRIGGER club_managers_set_user_id
  BEFORE INSERT OR UPDATE OF email ON public.club_managers
  FOR EACH ROW EXECUTE FUNCTION public.sl_club_managers_set_user_id();

-- Mise à jour de sl_is_club_manager_for : préfère user_id, fallback email
-- pour les enregistrements antérieurs sans user_id.
CREATE OR REPLACE FUNCTION public.sl_is_club_manager_for(
  p_club_id TEXT,
  p_roles   TEXT[]
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.club_managers cm
    WHERE cm.club_id = p_club_id
      AND cm.role = ANY(p_roles)
      AND (
        cm.user_id = auth.uid()
        OR (
          cm.user_id IS NULL
          AND EXISTS (
            SELECT 1 FROM auth.users u
            WHERE lower(u.email) = lower(cm.email)
              AND u.id = auth.uid()
          )
        )
      )
  );
END;
$$;
