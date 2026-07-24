-- Migration: confirm_booking_payment_v2
-- Refined version that returns ticket data for signing and includes audit logging

BEGIN;

CREATE OR REPLACE FUNCTION confirm_booking_payment_v2(
  p_booking_id UUID,
  p_razorpay_payment_id VARCHAR(255),
  p_razorpay_signature VARCHAR(500),
  p_razorpay_method VARCHAR(50)
)
RETURNS TABLE (
  r_ticket_id UUID,
  r_event_id UUID,
  r_ticket_number VARCHAR(60)
) AS $$
DECLARE
  v_item RECORD;
  v_i INT;
  v_ticket_ref VARCHAR(60);
  v_event_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Fetch event_id and user_id
  SELECT event_id, user_id INTO v_event_id, v_user_id FROM bookings WHERE id = p_booking_id;

  -- 2. Update booking
  UPDATE bookings
  SET 
    status = 'confirmed',
    payment_status = 'paid',
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_signature = p_razorpay_signature,
    razorpay_method = p_razorpay_method,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or already processed';
  END IF;

  -- 3. Process items and create tickets
  FOR v_item IN (SELECT id, ticket_tier_id, quantity FROM booking_items WHERE booking_id = p_booking_id) LOOP
    -- Update counts in ticket_tiers
    UPDATE ticket_tiers
    SET 
      reserved_count = GREATEST(0, COALESCE(reserved_count, 0) - v_item.quantity),
      sold_count = COALESCE(sold_count, 0) + v_item.quantity,
      updated_at = NOW()
    WHERE id = v_item.ticket_tier_id;

    -- Create individual tickets
    FOR v_i IN 1..v_item.quantity LOOP
      v_ticket_ref := 'SM-TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 10));
      
      INSERT INTO tickets (
        booking_item_id,
        booking_id,
        event_id,
        ticket_number,
        holder_name,
        holder_email
      )
      SELECT 
        v_item.id,
        p_booking_id,
        v_event_id,
        v_ticket_ref,
        b.attendee_name,
        b.attendee_email
      FROM bookings b
      WHERE b.id = p_booking_id
      RETURNING tickets.id, tickets.event_id, tickets.ticket_number INTO r_ticket_id, r_event_id, r_ticket_number;
      
      RETURN NEXT;
    END LOOP;
  END LOOP;

  -- 4. Update event booking count
  UPDATE events
  SET 
    booking_count = COALESCE(booking_count, 0) + 1,
    updated_at = NOW()
  WHERE id = v_event_id;

  -- 5. Audit Log (internal table insert)
  INSERT INTO audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_user_id,
    'booking.payment_verified',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'razorpay_payment_id', p_razorpay_payment_id,
      'razorpay_order_id', (SELECT razorpay_order_id FROM bookings WHERE id = p_booking_id)
    )
  );

END;
$$ LANGUAGE plpgsql;

COMMIT;
