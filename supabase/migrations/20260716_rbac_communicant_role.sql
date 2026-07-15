-- ============================================================
-- RBAC : ajout du rôle « communicant » à la permission_matrix.
-- Le loop de seed initial (20260617) ne couvrait pas ce rôle → toutes ses
-- permissions étaient absentes (= refusées). Le communicant gère la
-- communication du club (annonces) mais pas l'effectif ni les matchs.
-- 100% additif (INSERT ... ON CONFLICT DO NOTHING + UPDATE ciblé).
-- ============================================================

DO $$
DECLARE
  resources TEXT[] := ARRAY['clubs','teams','matches','trainings','convocations','carpooling','messaging','announcements','payments','settings'];
  actions   TEXT[] := ARRAY['view','create','edit','delete','export','invite','admin'];
  res TEXT; act TEXT;
BEGIN
  FOREACH res IN ARRAY resources LOOP
    FOREACH act IN ARRAY actions LOOP
      INSERT INTO public.permission_matrix (role, resource, action, allowed)
      VALUES ('communicant', res, act, false)
      ON CONFLICT (role, resource, action) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Droits réels du communicant : consultation large + gestion des annonces.
UPDATE public.permission_matrix SET allowed = true WHERE
  role = 'communicant' AND (
       (resource IN ('clubs','matches','trainings','carpooling','announcements') AND action = 'view')
    OR (resource = 'announcements' AND action IN ('create','edit','delete'))
    OR (resource = 'messaging'     AND action IN ('view','create'))
  );
