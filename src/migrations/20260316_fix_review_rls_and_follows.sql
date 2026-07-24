-- Migration: Fix RLS for event_reviews and host_follows
-- Date: 2026-03-16

BEGIN;

-- 1. Relax event_reviews INSERT policy to include 'paid' bookings
DROP POLICY IF EXISTS "Users can create reviews for events they attended" ON event_reviews;
CREATE POLICY "Users can create reviews for events they attended"
ON event_reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE event_id = event_reviews.event_id
    AND user_id = auth.uid()
    AND status IN ('confirmed', 'paid')
  )
);

-- 2. Ensure host_follows RLS uses host_page_id if applicable
-- Check current policies first
-- DROP POLICY IF EXISTS "Users can follow hosts" ON host_follows;
-- CREATE POLICY "Users can follow hosts" ON host_follows
-- FOR ALL TO authenticated
-- USING (auth.uid() = follower_id)
-- WITH CHECK (auth.uid() = follower_id);

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP POLICY "Users can create reviews for events they attended" ON event_reviews;
-- CREATE POLICY "Users can create reviews for events they attended"
-- ON event_reviews FOR INSERT
-- WITH CHECK (
--   auth.uid() = user_id AND
--   EXISTS (
--     SELECT 1 FROM bookings
--     WHERE event_id = event_reviews.event_id
--     AND user_id = auth.uid()
--     AND status = 'confirmed'
--   )
-- );
-- COMMIT;
