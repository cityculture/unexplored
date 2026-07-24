-- Migration: Social Functions
-- Description: RPCs for atomic operations on saves, likes, interests, and follows.
-- Run this manually in the Supabase SQL editor.

BEGIN;

-- 1. toggle_event_save
CREATE OR REPLACE FUNCTION toggle_event_save(p_user_id UUID, p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_count INT;
BEGIN
    -- Check if save exists
    SELECT EXISTS(
        SELECT 1 FROM event_saves 
        WHERE user_id = p_user_id AND event_id = p_event_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Delete save and decrement count
        DELETE FROM event_saves WHERE user_id = p_user_id AND event_id = p_event_id;
        
        UPDATE events 
        SET saves_count = GREATEST(saves_count - 1, 0)
        WHERE id = p_event_id
        RETURNING saves_count INTO v_new_count;
        
        RETURN json_build_object('saved', false, 'newCount', v_new_count);
    ELSE
        -- Insert save and increment count
        INSERT INTO event_saves (user_id, event_id) VALUES (p_user_id, p_event_id);
        
        UPDATE events 
        SET saves_count = saves_count + 1
        WHERE id = p_event_id
        RETURNING saves_count INTO v_new_count;
        
        RETURN json_build_object('saved', true, 'newCount', v_new_count);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. toggle_event_like
CREATE OR REPLACE FUNCTION toggle_event_like(p_user_id UUID, p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_count INT;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM event_likes 
        WHERE user_id = p_user_id AND event_id = p_event_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM event_likes WHERE user_id = p_user_id AND event_id = p_event_id;
        
        UPDATE events 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = p_event_id
        RETURNING likes_count INTO v_new_count;
        
        RETURN json_build_object('liked', false, 'newCount', v_new_count);
    ELSE
        INSERT INTO event_likes (user_id, event_id) VALUES (p_user_id, p_event_id);
        
        UPDATE events 
        SET likes_count = likes_count + 1
        WHERE id = p_event_id
        RETURNING likes_count INTO v_new_count;
        
        RETURN json_build_object('liked', true, 'newCount', v_new_count);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. set_event_interest
CREATE OR REPLACE FUNCTION set_event_interest(p_user_id UUID, p_event_id UUID, p_interest_type VARCHAR)
RETURNS JSON AS $$
DECLARE
    v_old_interest VARCHAR;
    v_new_count INT;
BEGIN
    -- Get current interest if any
    SELECT interest_type INTO v_old_interest FROM event_interests 
    WHERE user_id = p_user_id AND event_id = p_event_id;

    IF v_old_interest IS NULL THEN
        -- Insert new interest and increment
        INSERT INTO event_interests (user_id, event_id, interest_type) 
        VALUES (p_user_id, p_event_id, p_interest_type);
        
        UPDATE events 
        SET interests_count = interests_count + 1
        WHERE id = p_event_id
        RETURNING interests_count INTO v_new_count;
    ELSE
        -- Update existing interest (count doesn't change unless we were removing, but here we just upsert)
        -- If we want to allow removing interest completely, we'd need a separate remove function or pass null.
        -- Based on instructions: "Upsert into event_interests, update count accordingly"
        -- Actually, if they are just changing from 'interested' to 'going', the count of people who have an interest doesn't change.
        -- If we want to decrement when they un-interest, we'd need that logic. Let's assume the action always sets an interest.
        UPDATE event_interests
        SET interest_type = p_interest_type
        WHERE user_id = p_user_id AND event_id = p_event_id;
        
        SELECT interests_count INTO v_new_count FROM events WHERE id = p_event_id;
    END IF;

    RETURN json_build_object('interest_type', p_interest_type, 'count', v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. toggle_host_follow
CREATE OR REPLACE FUNCTION toggle_host_follow(p_follower_id UUID, p_host_id UUID)
RETURNS JSON AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_count INT;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM host_follows 
        WHERE follower_id = p_follower_id AND host_id = p_host_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM host_follows WHERE follower_id = p_follower_id AND host_id = p_host_id;
        
        UPDATE host_profiles 
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = p_host_id
        RETURNING follower_count INTO v_new_count;
        
        RETURN json_build_object('following', false, 'count', v_new_count);
    ELSE
        INSERT INTO host_follows (follower_id, host_id) VALUES (p_follower_id, p_host_id);
        
        UPDATE host_profiles 
        SET follower_count = follower_count + 1
        WHERE id = p_host_id
        RETURNING follower_count INTO v_new_count;
        
        RETURN json_build_object('following', true, 'count', v_new_count);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. submit_event_review
CREATE OR REPLACE FUNCTION submit_event_review(
    p_user_id UUID, 
    p_event_id UUID, 
    p_rating SMALLINT,
    p_title VARCHAR DEFAULT NULL,
    p_review_text TEXT DEFAULT NULL,
    p_rating_venue SMALLINT DEFAULT NULL,
    p_rating_host SMALLINT DEFAULT NULL,
    p_rating_value SMALLINT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_host_id UUID;
    v_booking_id UUID;
    v_new_avg DECIMAL(3,2);
    v_new_count INT;
BEGIN
    -- 1. Check if event has ended
    IF NOT EXISTS (
        SELECT 1 FROM events WHERE id = p_event_id AND end_datetime < NOW()
    ) THEN
        RETURN json_build_object('error', 'Event has not ended yet.');
    END IF;

    -- 2. Check if user attended (confirmed booking)
    SELECT id INTO v_booking_id FROM bookings 
    WHERE user_id = p_user_id AND event_id = p_event_id AND status = 'confirmed' 
    LIMIT 1;
    
    IF v_booking_id IS NULL THEN
        RETURN json_build_object('error', 'You must have attended this event to leave a review.');
    END IF;

    -- 3. Check if already reviewed
    IF EXISTS (
        SELECT 1 FROM event_reviews WHERE user_id = p_user_id AND event_id = p_event_id
    ) THEN
        RETURN json_build_object('error', 'You have already reviewed this event.');
    END IF;

    -- Get host_id for the event
    SELECT host_id INTO v_host_id FROM events WHERE id = p_event_id;

    -- 4. Insert Review
    INSERT INTO event_reviews (
        event_id, user_id, booking_id, rating, title, review_text, 
        rating_venue, rating_host, rating_value
    ) VALUES (
        p_event_id, p_user_id, v_booking_id, p_rating, p_title, p_review_text,
        p_rating_venue, p_rating_host, p_rating_value
    );

    -- 5. Recalculate Host Rating
    -- We'll do a simple recalculation based on all approved reviews for this host's events
    -- This could be optimized to an incremental update, but a full recalc is safer against drift
    SELECT 
        COALESCE(AVG(r.rating), 0), 
        COUNT(r.id)
    INTO v_new_avg, v_new_count
    FROM event_reviews r
    JOIN events e ON r.event_id = e.id
    WHERE e.host_id = v_host_id AND r.is_approved = true;

    UPDATE host_profiles 
    SET rating_avg = v_new_avg, rating_count = v_new_count
    WHERE id = v_host_id;

    RETURN json_build_object('success', true, 'new_avg', v_new_avg, 'new_count', v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. toggle_review_helpful
CREATE OR REPLACE FUNCTION toggle_review_helpful(p_user_id UUID, p_review_id UUID)
RETURNS JSON AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_count INT;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM review_helpful_votes 
        WHERE user_id = p_user_id AND review_id = p_review_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM review_helpful_votes WHERE user_id = p_user_id AND review_id = p_review_id;
        
        UPDATE event_reviews 
        SET helpful_count = GREATEST(helpful_count - 1, 0)
        WHERE id = p_review_id
        RETURNING helpful_count INTO v_new_count;
        
        RETURN json_build_object('helpful', false, 'count', v_new_count);
    ELSE
        INSERT INTO review_helpful_votes (user_id, review_id, is_helpful) VALUES (p_user_id, p_review_id, true);
        
        UPDATE event_reviews 
        SET helpful_count = helpful_count + 1
        WHERE id = p_review_id
        RETURNING helpful_count INTO v_new_count;
        
        RETURN json_build_object('helpful', true, 'count', v_new_count);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Rollback Instructions:
-- BEGIN;
-- DROP FUNCTION IF EXISTS toggle_event_save(UUID, UUID);
-- DROP FUNCTION IF EXISTS toggle_event_like(UUID, UUID);
-- DROP FUNCTION IF EXISTS set_event_interest(UUID, UUID, VARCHAR);
-- DROP FUNCTION IF EXISTS toggle_host_follow(UUID, UUID);
-- COMMIT;
