-- Migration: Add Full-Text Search and Update v_events_public
-- Description: Adds a generated fts column to events and updates the public view to include is_sponsored and fts for optimized search.

BEGIN;

-- 1. Add fts column to events table
-- This column combines title, short_description and description for full-text search
ALTER TABLE events ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(short_description, '') || ' ' || 
        coalesce(description, '')
    )
) STORED;

-- 2. Create index for fts
CREATE INDEX IF NOT EXISTS idx_events_fts ON events USING GIN(fts);

-- 3. Update v_events_public view
-- Drop existing view first
DROP VIEW IF EXISTS v_events_public;

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
    e.is_sponsored, -- Added
    e.views_count,
    e.likes_count,
    e.interests_count,
    e.booking_count,
    e.fts, -- Added for search results optimization
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
LEFT JOIN host_profiles hp ON hp.user_id = e.host_id
LEFT JOIN ticket_tiers tt ON tt.event_id = e.id AND tt.is_active = TRUE
WHERE e.status = 'published'
GROUP BY e.id, c.id, l.id, u.id, hp.id;

COMMIT;

-- Rollback:
-- BEGIN;
-- DROP VIEW IF EXISTS v_events_public;
-- -- Recreate original view...
-- ALTER TABLE events DROP COLUMN IF EXISTS fts;
-- COMMIT;
