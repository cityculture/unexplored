-- Migration: Allow multiple host pages and enforce subscription relation
BEGIN;

-- 1. Remove unique constraint on user_id in host_pages (was previously host_profiles)
-- We try both names as the table might have been renamed
ALTER TABLE host_pages DROP CONSTRAINT IF EXISTS host_profiles_user_id_key;
ALTER TABLE host_pages DROP CONSTRAINT IF EXISTS host_pages_user_id_key;

-- 2. Ensure host_page_id in events is properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_events_host_page_id ON events(host_page_id);

-- 3. Add index on subscriptions status and expiry for fast validation
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiry ON subscriptions(host_page_id, status, ends_at);

COMMIT;

-- Rollback:
-- BEGIN;
-- ALTER TABLE host_pages ADD CONSTRAINT host_pages_user_id_key UNIQUE (user_id);
-- DROP INDEX IF EXISTS idx_events_host_page_id;
-- DROP INDEX IF EXISTS idx_subscriptions_status_expiry;
-- COMMIT;
