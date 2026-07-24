-- Migration: Add vertical_poster_url to events
-- Description: Adds a compulsory 4:5 vertical poster field for events.
-- Rollback: ALTER TABLE public.events DROP COLUMN IF EXISTS vertical_poster_url;

BEGIN;

-- Add the column
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS vertical_poster_url TEXT;

-- Update the public view to include the vertical poster
CREATE OR REPLACE VIEW public.v_events_public AS
SELECT 
    e.*,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color_hex AS category_color,
    hp.display_name AS host_display_name,
    hp.logo_url AS host_logo,
    u.username AS host_username,
    (SELECT image_url FROM public.event_images WHERE event_id = e.id AND is_cover = true LIMIT 1) AS cover_image_url,
    (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') AS booking_count,
    (SELECT COUNT(*) FROM public.event_likes WHERE event_id = e.id) AS likes_count,
    (SELECT COUNT(*) FROM public.event_interests WHERE event_id = e.id) AS interests_count
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.host_profiles hp ON e.host_id = hp.user_id
LEFT JOIN public.users u ON e.host_id = u.id;

COMMIT;
