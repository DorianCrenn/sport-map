-- ─── Transport logistique sur convocations ────────────────────────────────────
-- Quand un parent répond "Présent" à une convocation, il déclare son mode
-- de transport. Si 'driving', un trajet est automatiquement créé dans `rides`.

-- 1. Colonnes sur event_convocations
ALTER TABLE public.event_convocations
  ADD COLUMN IF NOT EXISTS transport_mode TEXT
    CHECK (transport_mode IN ('driving', 'passenger', 'own_means')),
  ADD COLUMN IF NOT EXISTS driver_seats SMALLINT;

-- 2. RPC étendue
-- Supprimer l'ancienne signature (3 params) pour éviter l'ambiguïté de surcharge
DROP FUNCTION IF EXISTS respond_to_convocation(uuid, text, text);

CREATE OR REPLACE FUNCTION respond_to_convocation(
  p_convocation_id uuid,
  p_status         text,
  p_note           text     DEFAULT NULL,
  p_transport_mode text     DEFAULT NULL,
  p_driver_seats   smallint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_player_id  uuid;
  v_event_id   uuid;
  v_attend     text;
  v_drv_name   text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT player_id, event_id INTO v_player_id, v_event_id
  FROM event_convocations WHERE id = p_convocation_id;

  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'convocation_not_found';
  END IF;

  -- Vérifie autorisation : joueur direct OU tuteur légal
  IF NOT EXISTS (
    SELECT 1 FROM club_players WHERE id = v_player_id AND user_id = v_uid
    UNION ALL
    SELECT 1 FROM player_guardians WHERE player_id = v_player_id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Mise à jour de la convocation (avec les nouveaux champs transport)
  UPDATE event_convocations
  SET status         = p_status,
      note           = p_note,
      transport_mode = p_transport_mode,
      driver_seats   = p_driver_seats,
      responded_by   = v_uid,
      updated_at     = now()
  WHERE id = p_convocation_id;

  -- Synchronisation avec match_player_attendance
  v_attend := CASE p_status
    WHEN 'accepted'     THEN 'present'
    WHEN 'declined'     THEN 'absent'
    WHEN 'unavailable'  THEN 'absent'
    ELSE NULL
  END;

  IF v_attend IS NOT NULL THEN
    INSERT INTO match_player_attendance (event_id, user_id, status, updated_at)
    VALUES (v_event_id, v_uid, v_attend, now())
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET status = v_attend, updated_at = now();
  END IF;

  -- Si le parent conduit : créer automatiquement un trajet dans rides
  IF p_status = 'accepted' AND p_transport_mode = 'driving' AND p_driver_seats IS NOT NULL THEN
    SELECT name INTO v_drv_name FROM profiles WHERE id = v_uid;
    INSERT INTO rides (
      event_id,
      driver_id,
      driver_name,
      departure_location,
      available_seats,
      status
    ) VALUES (
      v_event_id::text,
      v_uid,
      COALESCE(v_drv_name, ''),
      '',
      p_driver_seats,
      'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_convocation TO authenticated;
