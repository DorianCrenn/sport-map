-- ─── Historique roulement conducteurs ────────────────────────────────────────
-- Traçabilité des trajets effectués pour équilibrer la participation.
-- Alimenté par un trigger quand rides.status → 'completed'.

CREATE TABLE IF NOT EXISTS carpool_history (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id       text,
  seats_offered int  NOT NULL DEFAULT 1 CHECK (seats_offered BETWEEN 1 AND 8),
  seats_filled  int  NOT NULL DEFAULT 0 CHECK (seats_filled >= 0),
  driven_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ch_club_driver_idx ON carpool_history(club_id, driver_id, driven_at DESC);
CREATE INDEX IF NOT EXISTS ch_event_idx       ON carpool_history(event_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE carpool_history ENABLE ROW LEVEL SECURITY;

-- Coach/admin du club peut lire les stats de roulement
CREATE POLICY ch_select ON carpool_history
  FOR SELECT TO authenticated USING (
    driver_id = auth.uid()
    OR sl_is_admin()
    OR EXISTS (
      SELECT 1 FROM clubs c WHERE c.id::text = club_id AND c.user_id = auth.uid()
    )
    OR sl_is_club_manager_for(club_id, ARRAY['manager','editor'])
  );

-- Insert via trigger ou RPC uniquement
CREATE POLICY ch_insert ON carpool_history
  FOR INSERT WITH CHECK (sl_is_admin() OR driver_id = auth.uid());

-- ─── Trigger : auto-insertion quand rides.status → 'completed' ───────────────

CREATE OR REPLACE FUNCTION trg_rides_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_filled int;
  v_club   text;
BEGIN
  IF OLD.status <> 'completed' AND NEW.status = 'completed' THEN
    -- Compte les passagers acceptés
    SELECT COUNT(*) INTO v_filled
    FROM ride_requests
    WHERE ride_id = NEW.id AND status = 'accepted';

    -- Récupère le club_id depuis l'event
    SELECT e.club_id INTO v_club
    FROM events e WHERE e.id::text = NEW.event_id::text;

    INSERT INTO carpool_history (event_id, driver_id, club_id, seats_offered, seats_filled, driven_at)
    VALUES (NEW.event_id::uuid, NEW.driver_id, v_club, NEW.available_seats, v_filled, now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rides_completed ON rides;
CREATE TRIGGER trg_rides_completed
  AFTER UPDATE OF status ON rides
  FOR EACH ROW EXECUTE FUNCTION trg_rides_completed();
