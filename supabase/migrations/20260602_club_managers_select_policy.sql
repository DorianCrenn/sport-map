-- ROLES-001d : politique SELECT manquante sur club_managers
-- Sans cette policy, les requêtes frontend sur club_managers retournent 403.
-- La table était lisible uniquement via les fonctions SECURITY DEFINER
-- (sl_is_club_manager_for, sl_can_manage_club) mais pas en lecture directe.
--
-- auth.email() ne fonctionne pas fiablement en contexte RLS.
-- Pattern correct : JOIN auth.users sur uid — identique à sl_is_club_manager_for.

DROP POLICY IF EXISTS "managers_select_own_or_owner" ON public.club_managers;

CREATE POLICY "managers_select_own_or_owner"
  ON public.club_managers FOR SELECT
  USING (
    -- Le manager peut voir ses propres lignes (join auth.users sur uid)
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND lower(u.email) = lower(club_managers.email)
    )
    -- Le propriétaire du club voit qui gère son club
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Les admins plateforme voient tout
    OR public.sl_is_admin()
  );
