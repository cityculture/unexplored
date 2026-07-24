-- Migration: Add INSERT policy for subscriptions
BEGIN;

-- Policy: Users can insert their own subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
