-- Waitlist Atomic Joining Function
-- Ensures position calculation is race-condition safe and prevents duplicate entries cleanly.

BEGIN;

CREATE OR REPLACE FUNCTION join_waitlist_atomic(
  p_event_id UUID,
  p_tier_id UUID,
  p_user_id UUID
) RETURNS TABLE (
  r_position INT,
  r_status VARCHAR,
  r_was_already_on_list BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
  v_position INT;
  v_existing_status VARCHAR;
BEGIN
  -- 1. Check if already exists
  SELECT status, position INTO v_existing_status, v_position
  FROM event_waitlist
  WHERE event_id = p_event_id 
    AND (ticket_tier_id = p_tier_id OR (ticket_tier_id IS NULL AND p_tier_id IS NULL))
    AND user_id = p_user_id;

  IF FOUND THEN
    RETURN QUERY SELECT v_position, v_existing_status, TRUE;
    RETURN;
  END IF;

  -- 2. Lock for specific event/tier to calculate position safely
  -- Using a row-level lock on the event to serialize waitlist inserts for that event
  PERFORM id FROM events WHERE id = p_event_id FOR UPDATE;

  -- 3. Calculate next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM event_waitlist
  WHERE event_id = p_event_id 
    AND (ticket_tier_id = p_tier_id OR (ticket_tier_id IS NULL AND p_tier_id IS NULL));

  -- 4. Insert
  INSERT INTO event_waitlist (
    event_id, 
    ticket_tier_id, 
    user_id, 
    position, 
    status,
    created_at
  )
  VALUES (
    p_event_id, 
    p_tier_id, 
    p_user_id, 
    v_position, 
    'waiting',
    NOW()
  );

  RETURN QUERY SELECT v_position, CAST('waiting' AS VARCHAR), FALSE;
END;
$$;

COMMIT;

-- Rollback:
-- DROP FUNCTION join_waitlist_atomic(UUID, UUID, UUID);
