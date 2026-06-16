-- Migration : admin feedback management
-- Ajoute : admin_note, admin_updated_by, table feedback_notifications + trigger

-- 1. Colonnes admin sur app_feedback
ALTER TABLE public.app_feedback
  ADD COLUMN IF NOT EXISTS admin_note       text,
  ADD COLUMN IF NOT EXISTS admin_updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Table de notifications in-app (changements de statut)
CREATE TABLE IF NOT EXISTS public.feedback_notifications (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_id    uuid NOT NULL REFERENCES public.app_feedback(id) ON DELETE CASCADE,
  feedback_title text NOT NULL,
  feedback_type  public.feedback_type NOT NULL,
  old_status     public.feedback_status,
  new_status     public.feedback_status NOT NULL,
  read           boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fn_user_unread_idx
  ON public.feedback_notifications(user_id, read, created_at DESC);

-- 3. RLS feedback_notifications
ALTER TABLE public.feedback_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fn_select_own"   ON public.feedback_notifications;
DROP POLICY IF EXISTS "fn_insert_admin" ON public.feedback_notifications;
DROP POLICY IF EXISTS "fn_update_own"   ON public.feedback_notifications;

-- L'utilisateur voit uniquement ses propres notifications
CREATE POLICY "fn_select_own" ON public.feedback_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Seul le trigger (SECURITY DEFINER) insère — pas de politique INSERT directe
-- Sauf admin pour debug/tests
CREATE POLICY "fn_insert_admin" ON public.feedback_notifications
  FOR INSERT WITH CHECK (public.sl_is_admin());

-- L'utilisateur peut marquer ses notifications comme lues
CREATE POLICY "fn_update_own" ON public.feedback_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Trigger : crée une notification quand le statut d'un feedback change
CREATE OR REPLACE FUNCTION public.trg_feedback_status_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.feedback_notifications (
      user_id,
      feedback_id,
      feedback_title,
      feedback_type,
      old_status,
      new_status
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.title,
      NEW.type,
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_status_notify ON public.app_feedback;
CREATE TRIGGER trg_feedback_status_notify
  AFTER UPDATE ON public.app_feedback
  FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_status_notify();

-- 5. Index supplémentaire pour les requêtes admin fréquentes
CREATE INDEX IF NOT EXISTS feedback_priority_idx
  ON public.app_feedback(priority DESC, vote_count DESC)
  WHERE merged_into IS NULL;
