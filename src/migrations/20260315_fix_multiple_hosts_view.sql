-- Migration: Fix v_events_public and host_follows for Multiple Host Pages
-- Description: Updates the public events view to join host_pages by id and renames host_id to host_page_id in host_follows.

BEGIN;

-- 1. Update v_events_public view to use host_pages and link by host_page_id
DROP VIEW IF EXISTS v_events_public CASCADE;

CREATE VIEW v_events_public AS
SELECT
    e.id,
    e.slug,
    e.title,
    e.short_description,
    e.cover_image_url,
    e.event_type,
    e.ticketing_mode,
    e.start_datetime,
    e.end_datetime,
    e.timezone,
    e.status,
    e.is_featured,
    e.is_sponsored,
    e.views_count,
    e.likes_count,
    e.interests_count,
    e.booking_count,
    e.fts,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color_hex AS category_color,
    l.city,
    l.state,
    l.country,
    l.venue_name,
    u.username AS host_username,
    hp.display_name AS host_display_name,
    hp.logo_url AS host_logo,
    COALESCE(MIN(tt.price), 0) AS min_price,
    COALESCE(MAX(tt.price), 0) AS max_price
FROM events e
JOIN categories c ON c.id = e.category_id
LEFT JOIN locations l ON l.id = e.location_id
JOIN users u ON u.id = e.host_id
LEFT JOIN host_pages hp ON hp.id = e.host_page_id
LEFT JOIN ticket_tiers tt ON tt.event_id = e.id AND tt.is_active = TRUE
WHERE e.status = 'published'
GROUP BY e.id, c.id, l.id, u.id, hp.id;

-- 2. Update host_follows table if column host_id still exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='host_follows' AND column_name='host_id') THEN
        ALTER TABLE host_follows RENAME COLUMN host_id TO host_page_id;
    END IF;
END $$;

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP VIEW IF EXISTS v_events_public CASCADE;
-- -- Recreate previous view using host_profiles...
-- ALTER TABLE host_follows RENAME COLUMN host_page_id TO host_id;
-- COMMIT;
