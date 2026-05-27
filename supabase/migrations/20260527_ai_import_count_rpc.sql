-- AI-COST-001a (suite) : RPC pour incrémenter import_count
-- Appelée côté client quand un joueur est importé (détourage).

CREATE OR REPLACE FUNCTION public.increment_ai_import_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, import_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET import_count = club_ai_usage.import_count + 1;
END;
$$;
