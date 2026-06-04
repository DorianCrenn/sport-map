-- Fonction RPC sécurisée : un utilisateur peut supprimer son propre compte.
-- SECURITY DEFINER permet l'appel à auth.users sans passer par le service role côté client.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Supprimer les données applicatives en cascade (la plupart via ON DELETE CASCADE)
  -- Le DELETE sur auth.users déclenche les cascades sur profiles, club_follows, etc.
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Seul l'utilisateur authentifié peut appeler cette fonction sur lui-même
REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
