-- Migration: Create increment_reserved_count function
-- This function atomatically increments the reserved_count of a ticket tier
-- to prevent overselling during the checkout process.

BEGIN;

CREATE OR REPLACE FUNCTION increment_reserved_count(
  tier_id UUID,
  increment_by INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE ticket_tiers
  SET 
    reserved_count = COALESCE(reserved_count, 0) + increment_by,
    updated_at = NOW()
  WHERE id = tier_id;
END;
$$ LANGUAGE plpgsql;

-- Rollback:
-- DROP FUNCTION IF EXISTS increment_reserved_count(UUID, INT);

COMMIT;
