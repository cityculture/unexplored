-- ============================================================
-- CITY CULTURE — MIGRATION: ALLOW MULTIPLE HOST PAGES PER USER
-- ============================================================
-- Description: Removes the UNIQUE constraint on host_pages.user_id 
--              to allow one user to possess multiple host profiles,
--              each gated by its own subscription.
-- Author: Antigravity AI
-- Date: 2026-03-16
-- ============================================================

BEGIN;

-- 1. Identify and drop the unique constraint/index on user_id in host_pages
-- Note: In Supabase/PostgreSQL, a UNIQUE column often has an implicit index.
-- We check for the constraint name first.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'host_pages_user_id_key') THEN
        ALTER TABLE host_pages DROP CONSTRAINT host_pages_user_id_key;
    END IF;
END $$;

-- 2. Ensure RLS policies are up to date
-- The existing policy for host_pages (renamed from host_profiles in previous conversations)
-- seems to be: 
-- CREATE POLICY "Public can read approved hosts" ON host_pages
--    FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
-- CREATE POLICY "Users can manage own host profile" ON host_pages
--    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- These are already multi-row friendly since they use `auth.uid() = user_id`.

COMMIT;

-- ROLLBACK:
-- ALTER TABLE host_pages ADD CONSTRAINT host_pages_user_id_key UNIQUE (user_id);
