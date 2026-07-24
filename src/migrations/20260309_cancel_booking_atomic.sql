-- Migration: cancel_booking_atomic
-- This function handles the atomic cancellation of a booking
-- 1. Updates booking status to 'cancelled'
-- 2. Decrements sold_count in ticket_tiers
-- 3. Voids associated tickets

BEGIN;

CREATE OR REPLACE FUNCTION cancel_booking_atomic(
  p_booking_id UUID,
  p_cancelled_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- 1. Update booking
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_booking_id AND status = 'confirmed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be cancelled (must be in confirmed status)';
  END IF;

  -- 2. Process items to release quantities
  FOR v_item IN (SELECT ticket_tier_id, quantity FROM booking_items WHERE booking_id = p_booking_id) LOOP
    UPDATE ticket_tiers
    SET 
      sold_count = GREATEST(0, COALESCE(sold_count, 0) - v_item.quantity),
      updated_at = NOW()
    WHERE id = v_item.ticket_tier_id;
  END LOOP;

  -- 3. Void tickets
  UPDATE tickets
  SET 
    is_void = TRUE,
    voided_reason = COALESCE(p_reason, 'Booking cancelled by user'),
    updated_at = NOW()
  WHERE booking_id = p_booking_id;

  -- 4. Audit Log
  INSERT INTO audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_cancelled_by,
    'booking.cancelled',
    'booking',
    p_booking_id,
    jsonb_build_object('reason', p_reason)
  );

END;
$$ LANGUAGE plpgsql;

COMMIT;
