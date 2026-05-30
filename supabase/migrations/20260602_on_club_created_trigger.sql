-- Trigger : quand un club est créé, promouvoir automatiquement le créateur
-- en club_admin et lier son profil au nouveau club.
-- Condition : uniquement si le profil est encore 'user' (ne pas écraser
-- un club_admin qui créerait un second club).

CREATE OR REPLACE FUNCTION public.on_club_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET
    role    = 'club_admin',
    club_id = NEW.id
  WHERE id      = NEW.user_id
    AND role    = 'user';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_club_created();
