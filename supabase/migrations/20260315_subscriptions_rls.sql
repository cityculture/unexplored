-- Migration: Subscriptions RLS and multiple pages fix
BEGIN;

-- 1. Enable RLS on subscriptions if not already
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Policy: Service role can manage all (automatic in Supabase but good to be explicit)
-- Actually Supabase admin handles this.

COMMIT;
