-- Migration: Fix Host Dashboard and Reviews RLS
-- Description: Corrects booking count logic to count tickets instead of bookings, and fixes RLS for event reviews.

BEGIN;

-- 1. Fix RLS on event_reviews
-- Drop existing insert policies
DROP POLICY IF EXISTS "Allow appropriate users to review" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can create reviews for events they attended" ON public.event_reviews;

-- Create a single, clear insert policy
CREATE POLICY "Users can create reviews for events they attended"
ON public.event_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.bookings
        WHERE bookings.event_id = event_reviews.event_id
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'confirmed'
    )
);

-- 2. Update trigger function for booking_count to count tickets (quantities)
CREATE OR REPLACE FUNCTION public.handle_event_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate total tickets sold for the affected event(s)
    -- We sum the quantity from booking_items for all confirmed bookings
    UPDATE public.events e
    SET booking_count = (
        SELECT COALESCE(SUM(bi.quantity), 0)
        FROM public.bookings b
        JOIN public.booking_items bi ON b.id = bi.booking_id
        WHERE b.event_id = e.id AND b.status = 'confirmed'
    )
    WHERE e.id = NEW.event_id OR e.id = OLD.event_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Synchronize existing booking_count values across all events
UPDATE public.events e
SET booking_count = (
    SELECT COALESCE(SUM(bi.quantity), 0)
    FROM public.bookings b
    JOIN public.booking_items bi ON b.id = bi.booking_id
    WHERE b.event_id = e.id AND b.status = 'confirmed'
);

COMMIT;
