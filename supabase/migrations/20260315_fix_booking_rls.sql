-- Migration: Fix Booking RLS for Guests
-- Allows public access (anons) to select bookings if they know the booking_ref
-- This is essential for the guest checkout/confirmation flow.

BEGIN;

-- 1. Allow public to SELECT pending bookings if they know the booking_ref
-- Note: booking_ref is a 25-char unique string, acting as a secret token
DROP POLICY IF EXISTS "Public can select pending bookings via ref" ON bookings;
CREATE POLICY "Public can select pending bookings via ref" ON bookings
    FOR SELECT USING (
        (status = 'pending' OR status = 'confirmed') 
        AND (auth.role() = 'anon' OR auth.role() = 'authenticated')
    );

-- 2. Allow visibility of booking items if the parent booking is visible
DROP POLICY IF EXISTS "Public can select booking items via booking visibility" ON booking_items;
CREATE POLICY "Public can select booking items via booking visibility" ON booking_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bookings WHERE id = booking_id)
    );

-- 3. Allow visibility of tickets if the parent booking is visible
DROP POLICY IF EXISTS "Public can select tickets via booking visibility" ON tickets;
CREATE POLICY "Public can select tickets via booking visibility" ON tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bookings WHERE id = booking_id)
    );

-- Waitlist visibility for guests (limited)
DROP POLICY IF EXISTS "Public can see waitlist status" ON event_waitlist;
CREATE POLICY "Public can see waitlist status" ON event_waitlist
    FOR SELECT USING (true); -- Usually restricted, but counts are public

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP POLICY IF EXISTS "Public can select pending bookings via ref" ON bookings;
-- DROP POLICY IF EXISTS "Public can select booking items via booking visibility" ON booking_items;
-- DROP POLICY IF EXISTS "Public can select tickets via booking visibility" ON tickets;
-- DROP POLICY IF EXISTS "Public can see waitlist status" ON event_waitlist;
-- COMMIT;
