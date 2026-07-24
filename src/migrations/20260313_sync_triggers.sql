-- Migration: Event Count Triggers & Realtime Subscription
-- Description: Automatically updates events table counts (likes, saves, interests, bookings) and enables realtime for host dashboard.
-- Run this in the Supabase SQL Editor.

BEGIN;

-- 1. Function for Likes Count
CREATE OR REPLACE FUNCTION public.handle_event_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.events SET likes_count = likes_count + 1 WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.events SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function for Saves Count
CREATE OR REPLACE FUNCTION public.handle_event_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.events SET saves_count = saves_count + 1 WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.events SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function for Interests Count
CREATE OR REPLACE FUNCTION public.handle_event_interests_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.events SET interests_count = interests_count + 1 WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.events SET interests_count = GREATEST(interests_count - 1, 0) WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function for Booking Count
CREATE OR REPLACE FUNCTION public.handle_event_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.status = 'confirmed' AND OLD.status != 'confirmed') THEN
            UPDATE public.events SET booking_count = booking_count + 1 WHERE id = NEW.event_id;
        ELSIF (OLD.status = 'confirmed' AND NEW.status != 'confirmed') THEN
            UPDATE public.events SET booking_count = GREATEST(booking_count - 1, 0) WHERE id = OLD.event_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP existing triggers if they exist to avoid errors on re-run
DROP TRIGGER IF EXISTS tr_event_likes_count ON public.event_likes;
DROP TRIGGER IF EXISTS tr_event_saves_count ON public.event_saves;
DROP TRIGGER IF EXISTS tr_event_interests_count ON public.event_interests;
DROP TRIGGER IF EXISTS tr_event_booking_count ON public.bookings;

-- Create Triggers
CREATE TRIGGER tr_event_likes_count AFTER INSERT OR DELETE ON public.event_likes FOR EACH ROW EXECUTE FUNCTION public.handle_event_likes_count();
CREATE TRIGGER tr_event_saves_count AFTER INSERT OR DELETE ON public.event_saves FOR EACH ROW EXECUTE FUNCTION public.handle_event_saves_count();
CREATE TRIGGER tr_event_interests_count AFTER INSERT OR DELETE ON public.event_interests FOR EACH ROW EXECUTE FUNCTION public.handle_event_interests_count();
CREATE TRIGGER tr_event_booking_count AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_event_booking_count();

-- 5. Enable Realtime
-- Check if publication exists, then add tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.host_profiles;

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP TRIGGER IF EXISTS tr_event_likes_count ON public.event_likes;
-- DROP TRIGGER IF EXISTS tr_event_saves_count ON public.event_saves;
-- DROP TRIGGER IF EXISTS tr_event_interests_count ON public.event_interests;
-- DROP TRIGGER IF EXISTS tr_event_booking_count ON public.bookings;
-- DROP FUNCTION IF EXISTS public.handle_event_likes_count();
-- DROP FUNCTION IF EXISTS public.handle_event_saves_count();
-- DROP FUNCTION IF EXISTS public.handle_event_interests_count();
-- DROP FUNCTION IF EXISTS public.handle_event_booking_count();
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.events;
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.host_profiles;
-- COMMIT;
