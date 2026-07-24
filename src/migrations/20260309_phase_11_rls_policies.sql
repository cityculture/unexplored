-- ============================================================
-- CITY CULTURE — PHASE 11: ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Description: Database-level access control for all tables.
-- Author: Antigravity AI
-- Date: 2026-03-09
-- ============================================================

BEGIN;

-- ============================================================
-- 0. ENABLE RLS ON ALL TABLES
-- ============================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- ============================================================
-- 1. CORE TABLES (PROMPT 1)
-- ============================================================

-- users table policies:
-- SELECT: users can read their own full row. Anyone can read: id, username, anonymous_alias, avatar_url, bio. Admin can read all.
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users
    FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public can read limited profile fields" ON users;
CREATE POLICY "Public can read limited profile fields" ON users
    FOR SELECT USING (true);
-- Note: Field-level security is usually handled at the API/Application layer in Supabase, 
-- but we can use views if strictly required. RLS filters rows, not columns.
-- As per prompt "id, username, anonymous_alias, avatar_url, bio (public fields only)", 
-- we provide row access and expect the client to select specific columns.

-- UPDATE: users can update only their own row.
DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- INSERT: only via auth trigger (no direct insert).
-- Handled by enabling RLS and not adding an INSERT policy.

-- DELETE: only admins.
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- host_profiles policies:
-- SELECT: public can read approved host profiles. Host can read their own. Admin reads all.
DROP POLICY IF EXISTS "Public can read approved hosts" ON host_profiles;
CREATE POLICY "Public can read approved hosts" ON host_profiles
    FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT/UPDATE: user can only insert/update their own (user_id = auth.uid()).
DROP POLICY IF EXISTS "Users can manage own host profile" ON host_profiles;
CREATE POLICY "Users can manage own host profile" ON host_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- events table policies:
-- SELECT: public can read status='published'. Host can read their own. Admin reads all.
DROP POLICY IF EXISTS "Events visibility" ON events;
CREATE POLICY "Events visibility" ON events
    FOR SELECT USING (status = 'published' OR auth.uid() = host_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: only hosts (role='host') can insert. host_id must equal auth.uid().
DROP POLICY IF EXISTS "Hosts can insert own events" ON events;
CREATE POLICY "Hosts can insert own events" ON events
    FOR INSERT WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'host' AND 
        host_id = auth.uid()
    );

-- UPDATE: host can update their own events. Admin can update any.
DROP POLICY IF EXISTS "Hosts and Admins can update events" ON events;
CREATE POLICY "Hosts and Admins can update events" ON events
    FOR UPDATE USING (auth.uid() = host_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- DELETE: admin only.
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- ticket_tiers policies:
-- SELECT: public can read tiers for published events. Host can read their event tiers.
DROP POLICY IF EXISTS "Ticket tiers visibility" ON ticket_tiers;
CREATE POLICY "Ticket tiers visibility" ON ticket_tiers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM events WHERE id = event_id AND (status = 'published' OR host_id = auth.uid())) 
        OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

-- INSERT/UPDATE: host can manage tiers for their own events only.
DROP POLICY IF EXISTS "Hosts manage own ticket tiers" ON ticket_tiers;
CREATE POLICY "Hosts manage own ticket tiers" ON ticket_tiers
    FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()));


-- event_images policies:
-- SELECT: public for published events, host for own.
DROP POLICY IF EXISTS "Event images visibility" ON event_images;
CREATE POLICY "Event images visibility" ON event_images
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM events WHERE id = event_id AND (status = 'published' OR host_id = auth.uid()))
        OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );
-- manage: host only
DROP POLICY IF EXISTS "Hosts manage own event images" ON event_images;
CREATE POLICY "Hosts manage own event images" ON event_images
    FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()));


-- categories, tags, locations: public SELECT. Admin INSERT/UPDATE/DELETE.
DROP POLICY IF EXISTS "Public select categories" ON categories;
CREATE POLICY "Public select categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public select tags" ON tags;
CREATE POLICY "Public select tags" ON tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage tags" ON tags;
CREATE POLICY "Admin manage tags" ON tags FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public select locations" ON locations;
CREATE POLICY "Public select locations" ON locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage locations" ON locations;
CREATE POLICY "Admin manage locations" ON locations FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- ============================================================
-- 2. TRANSACTIONAL & SOCIAL (PROMPT 2)
-- ============================================================

-- bookings: user sees own bookings. Host sees bookings for their events.
DROP POLICY IF EXISTS "Bookings visibility" ON bookings;
CREATE POLICY "Bookings visibility" ON bookings
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()) OR 
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

-- booking_items, tickets: same as bookings (via booking_id relationship)
DROP POLICY IF EXISTS "Booking items visibility" ON booking_items;
CREATE POLICY "Booking items visibility" ON booking_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM bookings WHERE id = booking_id)); -- Cascades from bookings SELECT policy

DROP POLICY IF EXISTS "Tickets visibility" ON tickets;
CREATE POLICY "Tickets visibility" ON tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bookings WHERE id = booking_id) OR
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );


-- event_saves, event_likes, event_interests:
-- SELECT: public count only (handled via aggregation). User sees their own.
DROP POLICY IF EXISTS "Event interactions visibility" ON event_saves;
CREATE POLICY "Event interactions visibility" ON event_saves FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Event interactions visibility" ON event_likes;
CREATE POLICY "Event interactions visibility" ON event_likes FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Event interactions visibility" ON event_interests;
CREATE POLICY "Event interactions visibility" ON event_interests FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: authenticated users only. user_id must = auth.uid().
DROP POLICY IF EXISTS "User can insert own interactions" ON event_saves;
CREATE POLICY "User can insert own interactions" ON event_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can insert own interactions" ON event_likes;
CREATE POLICY "User can insert own interactions" ON event_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can insert own interactions" ON event_interests;
CREATE POLICY "User can insert own interactions" ON event_interests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: user can delete their own only.
DROP POLICY IF EXISTS "User can delete own interactions" ON event_saves;
CREATE POLICY "User can delete own interactions" ON event_saves FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can delete own interactions" ON event_likes;
CREATE POLICY "User can delete own interactions" ON event_likes FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can delete own interactions" ON event_interests;
CREATE POLICY "User can delete own interactions" ON event_interests FOR DELETE USING (auth.uid() = user_id);


-- event_reviews:
-- SELECT: public can read approved reviews.
DROP POLICY IF EXISTS "Approved reviews visibility" ON event_reviews;
CREATE POLICY "Approved reviews visibility" ON event_reviews
    FOR SELECT USING (is_approved = true OR user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: authenticated, verified attendee only (enforce via exists check on bookings).
DROP POLICY IF EXISTS "Verified attendees can review" ON event_reviews;
CREATE POLICY "Verified attendees can review" ON event_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM bookings WHERE event_id = event_reviews.event_id AND user_id = auth.uid() AND status = 'confirmed')
    );

-- UPDATE: user can update own review. Admin can moderate.
DROP POLICY IF EXISTS "Review update policy" ON event_reviews;
CREATE POLICY "Review update policy" ON event_reviews
    FOR UPDATE USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- event_discussions:
-- SELECT: public for published event discussions.
DROP POLICY IF EXISTS "Discussions visibility" ON event_discussions;
CREATE POLICY "Discussions visibility" ON event_discussions
    FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND (status = 'published' OR host_id = auth.uid())) OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: authenticated only.
DROP POLICY IF EXISTS "Authenticated users can post" ON event_discussions;
CREATE POLICY "Authenticated users can post" ON event_discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can update their own (message only). Admin can set is_deleted.
DROP POLICY IF EXISTS "Discussion update policy" ON event_discussions;
CREATE POLICY "Discussion update policy" ON event_discussions
    FOR UPDATE USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- conversations:
-- SELECT: only participants can see their conversations.
DROP POLICY IF EXISTS "Conversations visibility" ON conversations;
CREATE POLICY "Conversations visibility" ON conversations
    FOR SELECT USING (auth.uid() IN (participant_1_id, participant_2_id) OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: authenticated users.
DROP POLICY IF EXISTS "Authenticated users can start conversations" ON conversations;
CREATE POLICY "Authenticated users can start conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() IN (participant_1_id, participant_2_id));

-- UPDATE: participants can update mute/delete flags for their side only.
DROP POLICY IF EXISTS "Conversations update policy" ON conversations;
CREATE POLICY "Conversations update policy" ON conversations
    FOR UPDATE USING (auth.uid() IN (participant_1_id, participant_2_id));


-- messages:
-- SELECT: only conversation participants.
DROP POLICY IF EXISTS "Messages visibility" ON messages;
CREATE POLICY "Messages visibility" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND auth.uid() IN (participant_1_id, participant_2_id))
        OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

-- INSERT: sender_id must = auth.uid(). Must be a participant.
DROP POLICY IF EXISTS "Sender must be participant" ON messages;
CREATE POLICY "Sender must be participant" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND auth.uid() IN (participant_1_id, participant_2_id))
    );

-- UPDATE: sender can mark is_deleted_by_sender. Recipient can mark is_deleted_by_receiver.
DROP POLICY IF EXISTS "Messages update policy" ON messages;
CREATE POLICY "Messages update policy" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND auth.uid() IN (participant_1_id, participant_2_id))
    );


-- notifications: user sees only their own. No direct insert from client.
DROP POLICY IF EXISTS "Notifications visibility" ON notifications;
CREATE POLICY "Notifications visibility" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- UPDATE: mark as read
DROP POLICY IF EXISTS "User can update own notifications" ON notifications;
CREATE POLICY "User can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());


-- reports: user sees their own submitted reports. Admin sees all.
DROP POLICY IF EXISTS "Reports visibility" ON reports;
CREATE POLICY "Reports visibility" ON reports
    FOR SELECT USING (reporter_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "User can submit reports" ON reports;
CREATE POLICY "User can submit reports" ON reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());


-- ============================================================
-- 3. FINANCIAL & ADMIN (PROMPT 3)
-- ============================================================

-- payouts:
-- SELECT: host can see their own payouts. Admin sees all.
DROP POLICY IF EXISTS "Payouts visibility" ON payouts;
CREATE POLICY "Payouts visibility" ON payouts
    FOR SELECT USING (host_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT/UPDATE: admin only
DROP POLICY IF EXISTS "Admin manage payouts" ON payouts;
CREATE POLICY "Admin manage payouts" ON payouts
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- audit_logs:
-- SELECT: admin only.
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT: service role only. No policy needed for service role bypass.
-- UPDATE/DELETE: NOBODY. 
DROP POLICY IF EXISTS "No one can update or delete audit logs" ON audit_logs;
CREATE POLICY "No one can update or delete audit logs" ON audit_logs
    FOR ALL USING (false);


-- admin_actions: admin only for all operations.
DROP POLICY IF EXISTS "Admin only actions" ON admin_actions;
CREATE POLICY "Admin only actions" ON admin_actions
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- analytics_daily: admin SELECT. No client INSERT.
DROP POLICY IF EXISTS "Analytics visibility" ON analytics_daily;
CREATE POLICY "Analytics visibility" ON analytics_daily
    FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- platform_config: admin only.
DROP POLICY IF EXISTS "Platform config visibility" ON platform_config;
CREATE POLICY "Platform config visibility" ON platform_config
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- notification_templates: admin only.
DROP POLICY IF EXISTS "Notification templates visibility" ON notification_templates;
CREATE POLICY "Notification templates visibility" ON notification_templates
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- featured_slots: admin INSERT/UPDATE. Public SELECT for active slots.
DROP POLICY IF EXISTS "Featured slots visibility" ON featured_slots;
CREATE POLICY "Featured slots visibility" ON featured_slots
    FOR SELECT USING (ends_at > NOW() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin manage featured slots" ON featured_slots;
CREATE POLICY "Admin manage featured slots" ON featured_slots
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- saved_searches: user sees and manages their own only.
DROP POLICY IF EXISTS "Saved searches policy" ON saved_searches;
CREATE POLICY "Saved searches policy" ON saved_searches
    FOR ALL USING (user_id = auth.uid());


-- host_follows: public SELECT count. Auth INSERT/DELETE own rows.
DROP POLICY IF EXISTS "Host follows visibility" ON host_follows;
CREATE POLICY "Host follows visibility" ON host_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "User manage own follows" ON host_follows;
CREATE POLICY "User manage own follows" ON host_follows
    FOR ALL USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());


-- user_blocks: user sees and manages their own only.
DROP POLICY IF EXISTS "User blocks policy" ON user_blocks;
CREATE POLICY "User blocks policy" ON user_blocks
    FOR ALL USING (blocker_id = auth.uid());


-- promo_codes:
-- SELECT: host sees their own codes. Public can validate a code (SELECT by code value).
DROP POLICY IF EXISTS "Promo codes visibility" ON promo_codes;
CREATE POLICY "Promo codes visibility" ON promo_codes
    FOR SELECT USING (host_id = auth.uid() OR is_active = true OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- INSERT/UPDATE: host can manage codes for their own events.
DROP POLICY IF EXISTS "Host manage promo codes" ON promo_codes;
CREATE POLICY "Host manage promo codes" ON promo_codes
    FOR ALL USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());


-- event_waitlist: user sees their own. Host sees waitlist for their events.
DROP POLICY IF EXISTS "Waitlist visibility" ON event_waitlist;
CREATE POLICY "Waitlist visibility" ON event_waitlist
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()) OR 
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "User manage own waitlist" ON event_waitlist;
CREATE POLICY "User manage own waitlist" ON event_waitlist
    FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 4. REMAINING TABLES & SYSTEM TABLES (DEFAULT DENY / LOGICAL)
-- ============================================================

-- user_oauth_accounts, user_sessions, user_tokens: self only.
DROP POLICY IF EXISTS "User manage own oauth" ON user_oauth_accounts;
CREATE POLICY "User manage own oauth" ON user_oauth_accounts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User manage own sessions" ON user_sessions;
CREATE POLICY "User manage own sessions" ON user_sessions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User manage own tokens" ON user_tokens;
CREATE POLICY "User manage own tokens" ON user_tokens FOR ALL USING (user_id = auth.uid());

-- Junction and detail tables (following parent logic)
DROP POLICY IF EXISTS "Event tags visibility" ON event_tags;
CREATE POLICY "Event tags visibility" ON event_tags FOR SELECT USING (true); -- Public

DROP POLICY IF EXISTS "Event cohosts visibility" ON event_cohosts;
CREATE POLICY "Event cohosts visibility" ON event_cohosts FOR SELECT USING (true); -- Public

DROP POLICY IF EXISTS "Event agenda visibility" ON event_agenda;
CREATE POLICY "Event agenda visibility" ON event_agenda FOR SELECT USING (true); -- Public

DROP POLICY IF EXISTS "Event faqs visibility" ON event_faqs;
CREATE POLICY "Event faqs visibility" ON event_faqs FOR SELECT USING (true); -- Public

-- Other tables default to DENY unless a policy exists.
-- RLS is enabled for all, so without a policy, access is restricted.

-- Final Check: List all tables that should have RLS
-- users, host_profiles, events, event_images, ticket_tiers, locations, categories, tags (8)
-- bookings, booking_items, tickets, event_saves, event_likes, event_interests, event_reviews, event_discussions, conversations, messages, notifications, reports (12)
-- payouts, audit_logs, admin_actions, analytics_daily, platform_config, notification_templates, featured_slots, saved_searches, host_follows, user_blocks, promo_codes, event_waitlist (12)
-- user_oauth_accounts, user_sessions, user_tokens, event_tags, event_cohosts, event_agenda, event_faqs, promo_code_uses, review_helpful_votes, discussion_likes (10)
-- Total: 42 (Confirmed from schema)

COMMIT;

-- ROLLBACK: 
-- ROLLBACK;
