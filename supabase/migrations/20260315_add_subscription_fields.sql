-- Migration: Add Razorpay Subscription fields
BEGIN;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;

COMMIT;

-- Rollback:
-- BEGIN;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS razorpay_subscription_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS razorpay_plan_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS canceled_at;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS ended_at;
-- COMMIT;
