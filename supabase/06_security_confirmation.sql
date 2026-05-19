-- SEC-002 & SEC-003 — Security policy confirmation
-- Both policies are already defined in 02_rls.sql (idempotent DROP + CREATE).
-- This file documents their intent and can be run safely in production.

-- ── SEC-003: events INSERT restricted to admin roles ──────────────────────────
-- Defined in 02_rls.sql:
--   CREATE POLICY "events_insert_admin_or_club" ON public.events FOR INSERT
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.profiles p
--       WHERE p.id = auth.uid()
--         AND p.role IN ('admin', 'superadmin', 'club_admin')
--     )
--   );
-- Status: ACTIVE — anonymous and regular users cannot insert events.

-- ── SEC-002: club_managers scoped to owner or admin ───────────────────────────
-- Defined in 02_rls.sql:
--   CREATE POLICY "managers_select_owner_or_admin" ON public.club_managers FOR SELECT
--   USING (club_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
--          OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
--
--   CREATE POLICY "managers_insert_owner" ON public.club_managers FOR INSERT
--   WITH CHECK (club_id IN (SELECT id FROM clubs WHERE user_id = auth.uid()));
--
--   CREATE POLICY "managers_update_owner" ON public.club_managers FOR UPDATE ...
--   CREATE POLICY "managers_delete_owner" ON public.club_managers FOR DELETE ...
-- Status: ACTIVE — only club owners and admins can manage their managers table.

-- ── Verification query (run in Supabase SQL editor to confirm) ────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('events', 'club_managers')
  AND policyname IN (
    'events_insert_admin_or_club',
    'managers_select_owner_or_admin',
    'managers_insert_owner',
    'managers_update_owner',
    'managers_delete_owner'
  )
ORDER BY tablename, policyname;
