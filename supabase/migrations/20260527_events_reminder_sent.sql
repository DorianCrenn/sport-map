-- PUSH-PROD-001a : Colonne de tracking envoi rappel match
-- Permet au cron match-reminders de ne pas re-notifier le même event

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour le cron : events non-reminds avec un club_id
CREATE INDEX IF NOT EXISTS idx_events_reminder
  ON public.events (date, reminder_sent_at)
  WHERE reminder_sent_at IS NULL AND club_id IS NOT NULL;
