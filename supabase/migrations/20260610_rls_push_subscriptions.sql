-- SEC-RLS-001 : Durcissement RLS sur push_subscriptions
-- Remplace la politique "for all" trop large par des politiques granulaires.
-- Garantit que les clés WebPush (endpoint, p256dh, auth) ne sont jamais
-- lisibles par un autre utilisateur authentifié ni par anon.

-- Supprimer l'ancienne politique générique
DROP POLICY IF EXISTS "push_subscriptions_self" ON public.push_subscriptions;

-- SELECT : uniquement ses propres abonnements (les Edge Functions utilisent
-- service_role qui bypasse RLS — pas besoin de politique permissive ici)
CREATE POLICY "push_sub_select_own" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT : uniquement pour soi-même
CREATE POLICY "push_sub_insert_own" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE : uniquement ses propres abonnements
CREATE POLICY "push_sub_update_own" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE : uniquement ses propres abonnements
CREATE POLICY "push_sub_delete_own" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Aucune politique pour anon → accès refusé par défaut (RLS activé)
