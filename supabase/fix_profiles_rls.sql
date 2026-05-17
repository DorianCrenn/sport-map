-- SportLink — Fix profiles RLS infinite recursion
-- The previous policy checked profiles.role from within a profiles policy,
-- causing Postgres to throw "infinite recursion detected in policy".
-- Solution: use a SECURITY DEFINER function that bypasses RLS for the role check.
-- Exécuter dans : Supabase Dashboard → SQL Editor

-- Step 1: helper function (SECURITY DEFINER bypasses RLS on its own query)
CREATE OR REPLACE FUNCTION public.sl_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

-- Step 2: replace the broken policy
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public"       ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.sl_is_admin());
