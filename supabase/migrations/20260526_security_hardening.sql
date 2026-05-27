-- ============================================================
-- SportLink — Security hardening
-- 1. ride_notifications INSERT: restrict to parties involved in the ride
-- 2. club_page_views INSERT: require authentication (anti-spam analytics)
-- ============================================================

-- ── 1. ride_notifications ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rn_insert_auth"  ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_select_own"   ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_update_own"   ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_delete_own"   ON public.ride_notifications;

-- SELECT : only the recipient can read their own notifications
CREATE POLICY "rn_select_own"
  ON public.ride_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT : caller must be involved in the ride AND the recipient must also be
--   involved (driver or passenger with a request on the same ride).
--   Prevents any authenticated user from spamming arbitrary users.
CREATE POLICY "rn_insert_auth"
  ON public.ride_notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    -- Inserter must be the driver OR have a ride_request on this ride
    AND (
      EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = ride_id AND r.driver_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.ride_requests rr
        WHERE rr.ride_id = ride_id AND rr.passenger_id = auth.uid()
      )
    )
    -- Recipient must be the driver OR a passenger on the same ride
    AND (
      EXISTS (
        SELECT 1 FROM public.rides r
        WHERE r.id = ride_id AND r.driver_id = user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.ride_requests rr
        WHERE rr.ride_id = ride_id AND rr.passenger_id = user_id
      )
    )
  );

-- UPDATE : only the recipient (to mark as read)
CREATE POLICY "rn_update_own"
  ON public.ride_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE : only the recipient
CREATE POLICY "rn_delete_own"
  ON public.ride_notifications FOR DELETE
  USING (auth.uid() = user_id);


-- ── 2. club_page_views ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cpv_insert_public" ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_insert_auth"   ON public.club_page_views;

-- Require authentication to record a page view (prevents bot/crawler spam)
CREATE POLICY "cpv_insert_auth"
  ON public.club_page_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
