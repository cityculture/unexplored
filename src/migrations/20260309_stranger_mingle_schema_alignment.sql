-- ==============================================================================
-- CITY CULTURE -> STRANGER MINGLE COMPLETE DATABASE SCHEMA & TABLES ALIGNMENT
-- Target Database: kvhjzpqkzydvjwdtqswr.supabase.co (City Culture)
-- Reference Database: uuanzogrkoomekskvxab.supabase.co (Stranger Mingle)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. CREATE MISSING TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Table: host_profiles
-- (Stranger Mingle's host entity table. Re-created alongside host_pages with full data sync)
CREATE TABLE IF NOT EXISTS public.host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  host_type VARCHAR(20) NOT NULL DEFAULT 'individual',
  display_name VARCHAR(255) NOT NULL,
  organisation_name VARCHAR(255),
  tagline VARCHAR(300),
  description TEXT,
  profile_image VARCHAR(500),
  instagram_handle VARCHAR(100),
  facebook_url VARCHAR(500),
  twitter_handle VARCHAR(100),
  youtube_url VARCHAR(500),
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'IN',
  is_approved BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  kyc_status VARCHAR(20) DEFAULT 'verified',
  kyc_documents JSONB DEFAULT '{}',
  razorpay_account_id VARCHAR(255),
  razorpay_contact_id VARCHAR(255),
  bank_account_verified BOOLEAN DEFAULT true,
  total_events_hosted INTEGER DEFAULT 0,
  total_tickets_sold INTEGER DEFAULT 0,
  total_revenue NUMERIC(14,2) DEFAULT 0.00,
  follower_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy all existing hosts from host_pages into host_profiles if not already present
INSERT INTO public.host_profiles (
  id, user_id, host_type, display_name, organisation_name, tagline, description,
  instagram_handle, facebook_url, twitter_handle, youtube_url, logo_url, banner_url,
  city, state, country, is_approved, approved_by, approved_at, kyc_status,
  kyc_documents, razorpay_account_id, razorpay_contact_id, bank_account_verified,
  total_events_hosted, total_tickets_sold, total_revenue, follower_count,
  rating_avg, rating_count, bank_account_name, bank_account_number, bank_ifsc_code, upi_id,
  created_at, updated_at
)
SELECT 
  id, user_id, host_type, display_name, organisation_name, tagline, description,
  instagram_handle, facebook_url, twitter_handle, youtube_url, logo_url, banner_url,
  city, state, country, is_approved, approved_by, approved_at, kyc_status,
  kyc_documents, razorpay_account_id, razorpay_contact_id, bank_account_verified,
  total_events_hosted, total_tickets_sold, total_revenue, follower_count,
  rating_avg, rating_count, bank_account_name, bank_account_number, bank_ifsc_code, upi_id,
  created_at, updated_at
FROM public.host_pages
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  organisation_name = EXCLUDED.organisation_name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  banner_url = EXCLUDED.banner_url,
  instagram_handle = EXCLUDED.instagram_handle,
  facebook_url = EXCLUDED.facebook_url,
  twitter_handle = EXCLUDED.twitter_handle,
  youtube_url = EXCLUDED.youtube_url,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  is_approved = EXCLUDED.is_approved,
  kyc_status = EXCLUDED.kyc_status,
  bank_account_verified = EXCLUDED.bank_account_verified,
  bank_account_name = EXCLUDED.bank_account_name,
  bank_account_number = EXCLUDED.bank_account_number,
  bank_ifsc_code = EXCLUDED.bank_ifsc_code,
  upi_id = EXCLUDED.upi_id,
  updated_at = NOW();

-- 2.1b Bi-directional sync triggers between host_profiles and host_pages
CREATE OR REPLACE FUNCTION public.sync_host_profiles_to_pages()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.host_pages (
    id, user_id, host_type, display_name, organisation_name, tagline, description,
    instagram_handle, facebook_url, twitter_handle, youtube_url, logo_url, banner_url,
    city, state, country, is_approved, approved_by, approved_at, kyc_status,
    kyc_documents, razorpay_account_id, razorpay_contact_id, bank_account_verified,
    total_events_hosted, total_tickets_sold, total_revenue, follower_count,
    rating_avg, rating_count, bank_account_name, bank_account_number, bank_ifsc_code, upi_id,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.user_id, NEW.host_type, NEW.display_name, NEW.organisation_name, NEW.tagline, NEW.description,
    NEW.instagram_handle, NEW.facebook_url, NEW.twitter_handle, NEW.youtube_url, NEW.logo_url, NEW.banner_url,
    NEW.city, NEW.state, NEW.country, NEW.is_approved, NEW.approved_by, NEW.approved_at, NEW.kyc_status,
    NEW.kyc_documents, NEW.razorpay_account_id, NEW.razorpay_contact_id, NEW.bank_account_verified,
    NEW.total_events_hosted, NEW.total_tickets_sold, NEW.total_revenue, NEW.follower_count,
    NEW.rating_avg, NEW.rating_count, NEW.bank_account_name, NEW.bank_account_number, NEW.bank_ifsc_code, NEW.upi_id,
    NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    organisation_name = EXCLUDED.organisation_name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    instagram_handle = EXCLUDED.instagram_handle,
    facebook_url = EXCLUDED.facebook_url,
    twitter_handle = EXCLUDED.twitter_handle,
    youtube_url = EXCLUDED.youtube_url,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_approved = EXCLUDED.is_approved,
    kyc_status = EXCLUDED.kyc_status,
    bank_account_verified = EXCLUDED.bank_account_verified,
    bank_account_name = EXCLUDED.bank_account_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_ifsc_code = EXCLUDED.bank_ifsc_code,
    upi_id = EXCLUDED.upi_id,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_host_profiles_to_pages ON public.host_profiles;
CREATE TRIGGER trg_sync_host_profiles_to_pages
AFTER INSERT OR UPDATE ON public.host_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_host_profiles_to_pages();

CREATE OR REPLACE FUNCTION public.sync_host_pages_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.host_profiles (
    id, user_id, host_type, display_name, organisation_name, tagline, description,
    instagram_handle, facebook_url, twitter_handle, youtube_url, logo_url, banner_url,
    city, state, country, is_approved, approved_by, approved_at, kyc_status,
    kyc_documents, razorpay_account_id, razorpay_contact_id, bank_account_verified,
    total_events_hosted, total_tickets_sold, total_revenue, follower_count,
    rating_avg, rating_count, bank_account_name, bank_account_number, bank_ifsc_code, upi_id,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.user_id, NEW.host_type, NEW.display_name, NEW.organisation_name, NEW.tagline, NEW.description,
    NEW.instagram_handle, NEW.facebook_url, NEW.twitter_handle, NEW.youtube_url, NEW.logo_url, NEW.banner_url,
    NEW.city, NEW.state, NEW.country, NEW.is_approved, NEW.approved_by, NEW.approved_at, NEW.kyc_status,
    NEW.kyc_documents, NEW.razorpay_account_id, NEW.razorpay_contact_id, NEW.bank_account_verified,
    NEW.total_events_hosted, NEW.total_tickets_sold, NEW.total_revenue, NEW.follower_count,
    NEW.rating_avg, NEW.rating_count, NEW.bank_account_name, NEW.bank_account_number, NEW.bank_ifsc_code, NEW.upi_id,
    NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    organisation_name = EXCLUDED.organisation_name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    instagram_handle = EXCLUDED.instagram_handle,
    facebook_url = EXCLUDED.facebook_url,
    twitter_handle = EXCLUDED.twitter_handle,
    youtube_url = EXCLUDED.youtube_url,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    is_approved = EXCLUDED.is_approved,
    kyc_status = EXCLUDED.kyc_status,
    bank_account_verified = EXCLUDED.bank_account_verified,
    bank_account_name = EXCLUDED.bank_account_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_ifsc_code = EXCLUDED.bank_ifsc_code,
    upi_id = EXCLUDED.upi_id,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_host_pages_to_profiles ON public.host_pages;
CREATE TRIGGER trg_sync_host_pages_to_profiles
AFTER INSERT OR UPDATE ON public.host_pages
FOR EACH ROW EXECUTE FUNCTION public.sync_host_pages_to_profiles();

-- 2.2 Table: groups
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Table: group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

-- 2.4 Table: host_applications
CREATE TABLE IF NOT EXISTS public.host_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  occupation TEXT,
  member_since TEXT NOT NULL,
  events_attended TEXT NOT NULL,
  why_host TEXT NOT NULL,
  event_formats TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT[] NOT NULL DEFAULT '{}',
  has_prior_experience TEXT NOT NULL,
  prior_experience_detail TEXT,
  safety_understanding TEXT NOT NULL,
  agree_to_terms BOOLEAN NOT NULL DEFAULT true,
  agree_to_safety BOOLEAN NOT NULL DEFAULT true,
  agree_to_zero_harassment BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Table: subscription_discount_codes
CREATE TABLE IF NOT EXISTS public.subscription_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  max_discount_amount NUMERIC(10,2),
  duration_type VARCHAR(20) NOT NULL DEFAULT 'once',
  duration_in_cycles INTEGER,
  applicable_plan_ids TEXT[],
  razorpay_offer_id VARCHAR(100),
  min_order_amount NUMERIC(10,2) DEFAULT 0.00,
  max_uses INTEGER,
  uses_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 Table: user_subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  razorpay_plan_id TEXT,
  status TEXT DEFAULT 'created',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  notes JSONB DEFAULT '{}',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  razorpay_payment_id TEXT,
  verification_token TEXT,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  discount_code_id UUID REFERENCES public.subscription_discount_codes(id),
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  original_amount NUMERIC(10,2),
  discount_duration_type VARCHAR(20),
  razorpay_order_id TEXT,
  plan_type VARCHAR(20) DEFAULT 'yearly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Table: subscription_discount_code_uses
CREATE TABLE IF NOT EXISTS public.subscription_discount_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES public.subscription_discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  discount_amount NUMERIC(10,2) NOT NULL,
  original_amount NUMERIC(10,2) NOT NULL,
  final_amount NUMERIC(10,2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  razorpay_order_id TEXT
);

-- 2.8 Table: venue_partners
CREATE TABLE IF NOT EXISTS public.venue_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  description TEXT,
  cover_image_url VARCHAR(500),
  website_url VARCHAR(500),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  amenities JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  rating_avg NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 Table: event_age_restrictions
CREATE TABLE IF NOT EXISTS public.event_age_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  restriction_text TEXT NOT NULL,
  min_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.10 Table: host_rating
CREATE TABLE IF NOT EXISTS public.host_rating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_host_rating UNIQUE (host_id, user_id)
);

-- 2.11 Table: host_reviews
CREATE TABLE IF NOT EXISTS public.host_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_host_review UNIQUE (host_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 3. COLUMN ALIGNMENTS ON EXISTING TABLES
-- ------------------------------------------------------------------------------

-- 3.1 events table: add missing Stranger Mingle columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_alt VARCHAR(255);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS vertical_poster_alt VARCHAR(255);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creation_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creation_fee_payment_id VARCHAR(255);

-- 3.2 users table: add missing group_uuid
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_uuid UUID;

-- 3.3 subscriptions table: add SM columns
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.host_profiles(id);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS rate_limit_events INTEGER DEFAULT 10;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3.4 ticket_tiers table: ensure compatibility with timestamptz
-- (Stranger Mingle uses timestamp with time zone for sale window)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.ticket_tiers ALTER COLUMN sale_start_at TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + sale_start_at)::timestamptz;
    ALTER TABLE public.ticket_tiers ALTER COLUMN sale_end_at TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + sale_end_at)::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- keep existing if cast not compatible
  END;
END $$;

-- ------------------------------------------------------------------------------
-- 4. VIEWS RECREATION & ALIGNMENT
-- ------------------------------------------------------------------------------

DROP VIEW IF EXISTS public.v_host_profile CASCADE;
DROP VIEW IF EXISTS public.v_events_public CASCADE;
DROP VIEW IF EXISTS public.v_ticket_availability CASCADE;

-- 4.1 View: v_host_profile
CREATE OR REPLACE VIEW public.v_host_profile AS
SELECT
  hp.id,
  hp.user_id,
  hp.display_name,
  hp.organisation_name,
  hp.tagline,
  hp.description,
  hp.profile_image,
  hp.logo_url,
  hp.banner_url,
  hp.city,
  hp.state,
  hp.country,
  hp.instagram_handle,
  hp.facebook_url,
  hp.twitter_handle,
  hp.youtube_url,
  hp.total_events_hosted,
  hp.follower_count,
  hp.rating_avg,
  hp.rating_count,
  hp.is_approved,
  u.username,
  u.anonymous_alias
FROM public.host_profiles hp
LEFT JOIN public.users u ON u.id = hp.user_id;

-- 4.2 View: v_events_public
CREATE OR REPLACE VIEW public.v_events_public AS
SELECT
  e.id,
  e.slug,
  e.title,
  e.description,
  e.short_description,
  e.cover_image_url,
  e.event_type,
  e.ticketing_mode,
  e.max_capacity,
  e.is_recurring,
  e.start_datetime,
  e.end_datetime,
  e.timezone,
  e.status,
  e.is_featured,
  e.is_sponsored,
  e.views_count,
  e.likes_count,
  e.interests_count,
  e.booking_count,
  e.meta_description,
  e.meta_title,
  e.created_at,
  e.updated_at,
  e.fts,
  e.location_id,
  c.name AS category_name,
  c.slug AS category_slug,
  c.color_hex AS category_color,
  l.city,
  l.state,
  l.country,
  l.venue_name,
  l.address_line1,
  l.address_line2,
  l.postal_code,
  l.latitude,
  l.longitude,
  l.google_maps_url,
  l.place_id,
  u.username AS host_username,
  u.anonymous_alias AS host_alias,
  COALESCE(hp.display_name, hpage.display_name) AS host_display_name,
  COALESCE(hp.logo_url, hpage.logo_url) AS host_logo,
  COALESCE(hp.tagline, hpage.tagline) AS host_tagline,
  COALESCE(min_t.price, 0) AS min_price,
  COALESCE(max_t.price, 0) AS max_price
FROM public.events e
LEFT JOIN public.categories c ON c.id = e.category_id
LEFT JOIN public.locations l ON l.id = e.location_id
LEFT JOIN public.users u ON u.id = e.host_id
LEFT JOIN public.host_profiles hp ON hp.user_id = e.host_id OR hp.id = e.host_id
LEFT JOIN public.host_pages hpage ON hpage.user_id = e.host_id OR hpage.id = e.host_id
LEFT JOIN LATERAL (
  SELECT MIN(price) AS price FROM public.ticket_tiers WHERE event_id = e.id AND is_active = true
) min_t ON true
LEFT JOIN LATERAL (
  SELECT MAX(price) AS price FROM public.ticket_tiers WHERE event_id = e.id AND is_active = true
) max_t ON true
WHERE e.status = 'published';

-- 4.3 View: v_ticket_availability
CREATE OR REPLACE VIEW public.v_ticket_availability AS
SELECT
  tt.id AS tier_id,
  tt.event_id,
  tt.name AS tier_name,
  tt.price,
  tt.currency,
  tt.tier_type,
  tt.total_quantity,
  tt.sold_count,
  tt.reserved_count,
  GREATEST(0, tt.total_quantity - tt.sold_count - tt.reserved_count) AS available,
  (tt.total_quantity - tt.sold_count - tt.reserved_count <= 0) AS is_sold_out
FROM public.ticket_tiers tt
WHERE tt.is_active = true;

-- ------------------------------------------------------------------------------
-- 5. RPC STORED PROCEDURES (ALL 6 MISSING IN CITY CULTURE)
-- ------------------------------------------------------------------------------

-- 5.1 Function: slugify
CREATE OR REPLACE FUNCTION public.slugify(value text)
RETURNS text AS $$
BEGIN
  RETURN lower(trim(both '-' from regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5.2 Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 5.3 Function: release_expired_locks_for_event
CREATE OR REPLACE FUNCTION public.release_expired_locks_for_event(p_event_id uuid)
RETURNS void AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN 
    SELECT bi.ticket_tier_id, bi.quantity
    FROM public.bookings b
    JOIN public.booking_items bi ON bi.booking_id = b.id
    WHERE b.event_id = p_event_id
      AND b.status = 'pending'
      AND (b.expires_at < NOW() OR (b.expires_at IS NULL AND b.created_at < NOW() - INTERVAL '15 minutes'))
  LOOP
    UPDATE public.ticket_tiers
    SET reserved_count = GREATEST(0, reserved_count - v_rec.quantity)
    WHERE id = v_rec.ticket_tier_id;
  END LOOP;

  UPDATE public.bookings
  SET status = 'expired'
  WHERE event_id = p_event_id
    AND status = 'pending'
    AND (expires_at < NOW() OR (expires_at IS NULL AND created_at < NOW() - INTERVAL '15 minutes'));
END;
$$ LANGUAGE plpgsql;

-- 5.4 Function: provision_host_auth_user
CREATE OR REPLACE FUNCTION public.provision_host_auth_user(target_email text, target_id uuid)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    UPDATE auth.users SET id = target_id WHERE email = target_email AND id <> target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Function: sync_host_auth_id
CREATE OR REPLACE FUNCTION public.sync_host_auth_id(target_email text, target_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET id = target_id WHERE email = target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Function: create_event_complex
-- (Atomic transactional creation of events and all related entities)
CREATE OR REPLACE FUNCTION public.create_event_complex(
  event_data jsonb,
  ticket_tiers jsonb DEFAULT '[]'::jsonb,
  agenda jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  cohosts jsonb DEFAULT '[]'::jsonb,
  age_restrictions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
  v_tier jsonb;
  v_agenda jsonb;
  v_faq jsonb;
  v_tag jsonb;
  v_cohost jsonb;
  v_age jsonb;
BEGIN
  -- 1. Insert Event
  INSERT INTO public.events (
    title,
    host_id,
    category_id,
    location_id,
    event_type,
    status,
    start_datetime,
    end_datetime,
    timezone,
    short_description,
    description,
    cover_image_url,
    cover_image_alt,
    vertical_poster_url,
    vertical_poster_alt,
    is_age_restricted,
    min_age,
    doors_open_at,
    refund_policy,
    refund_policy_text,
    ticketing_mode,
    online_event_url,
    online_platform,
    online_url_reveal,
    max_capacity,
    meta_title,
    meta_description,
    slug,
    is_recurring,
    recurrence_rule
  ) VALUES (
    (event_data->>'title'),
    (event_data->>'host_id')::uuid,
    (event_data->>'category_id')::uuid,
    NULLIF(event_data->>'location_id', '')::uuid,
    COALESCE(event_data->>'event_type', 'in_person'),
    COALESCE(event_data->>'status', 'draft'),
    (event_data->>'start_datetime')::timestamptz,
    (event_data->>'end_datetime')::timestamptz,
    COALESCE(event_data->>'timezone', 'Asia/Kolkata'),
    (event_data->>'short_description'),
    (event_data->>'description'),
    (event_data->>'cover_image_url'),
    (event_data->>'cover_image_alt'),
    (event_data->>'vertical_poster_url'),
    (event_data->>'vertical_poster_alt'),
    COALESCE((event_data->>'is_age_restricted')::boolean, false),
    NULLIF(event_data->>'min_age', '')::integer,
    NULLIF(event_data->>'doors_open_at', '')::timestamptz,
    COALESCE(event_data->>'refund_policy', 'no_refund'),
    (event_data->>'refund_policy_text'),
    COALESCE(event_data->>'ticketing_mode', 'platform'),
    (event_data->>'online_event_url'),
    (event_data->>'online_platform'),
    COALESCE(event_data->>'online_url_reveal', 'after_booking'),
    NULLIF(event_data->>'max_capacity', '')::integer,
    (event_data->>'meta_title'),
    (event_data->>'meta_description'),
    (event_data->>'slug'),
    COALESCE((event_data->>'is_recurring')::boolean, false),
    (event_data->>'recurrence_rule')
  ) RETURNING id INTO v_event_id;

  -- 2. Insert Ticket Tiers
  IF ticket_tiers IS NOT NULL AND jsonb_array_length(ticket_tiers) > 0 THEN
    FOR v_tier IN SELECT * FROM jsonb_array_elements(ticket_tiers) LOOP
      INSERT INTO public.ticket_tiers (
        event_id,
        name,
        description,
        tier_type,
        tier_category,
        price,
        currency,
        total_quantity,
        max_per_booking,
        min_per_booking,
        perks,
        is_active,
        is_visible,
        sort_order
      ) VALUES (
        v_event_id,
        (v_tier->>'name'),
        (v_tier->>'description'),
        COALESCE(v_tier->>'tier_type', 'paid'),
        COALESCE(v_tier->>'tier_category', 'general'),
        COALESCE((v_tier->>'price')::numeric, 0.00),
        COALESCE(v_tier->>'currency', 'INR'),
        COALESCE((v_tier->>'total_quantity')::integer, 100),
        COALESCE((v_tier->>'max_per_booking')::integer, 5),
        COALESCE((v_tier->>'min_per_booking')::integer, 1),
        COALESCE(v_tier->'perks', '[]'::jsonb),
        COALESCE((v_tier->>'is_active')::boolean, true),
        COALESCE((v_tier->>'is_visible')::boolean, true),
        COALESCE((v_tier->>'sort_order')::integer, 0)
      );
    END LOOP;
  END IF;

  -- 3. Insert Agenda
  IF agenda IS NOT NULL AND jsonb_array_length(agenda) > 0 THEN
    FOR v_agenda IN SELECT * FROM jsonb_array_elements(agenda) LOOP
      INSERT INTO public.event_agenda (
        event_id,
        title,
        description,
        speaker,
        starts_at,
        ends_at,
        sort_order
      ) VALUES (
        v_event_id,
        (v_agenda->>'title'),
        (v_agenda->>'description'),
        (v_agenda->>'speaker'),
        NULLIF(v_agenda->>'starts_at', '')::timestamptz,
        NULLIF(v_agenda->>'ends_at', '')::timestamptz,
        COALESCE((v_agenda->>'sort_order')::integer, 0)
      );
    END LOOP;
  END IF;

  -- 4. Insert FAQs
  IF faqs IS NOT NULL AND jsonb_array_length(faqs) > 0 THEN
    FOR v_faq IN SELECT * FROM jsonb_array_elements(faqs) LOOP
      INSERT INTO public.event_faqs (
        event_id,
        question,
        answer,
        sort_order
      ) VALUES (
        v_event_id,
        (v_faq->>'question'),
        (v_faq->>'answer'),
        COALESCE((v_faq->>'sort_order')::integer, 0)
      );
    END LOOP;
  END IF;

  -- 5. Insert Tags
  IF tags IS NOT NULL AND jsonb_array_length(tags) > 0 THEN
    FOR v_tag IN SELECT * FROM jsonb_array_elements(tags) LOOP
      IF (v_tag->>'tag_id') IS NOT NULL THEN
        INSERT INTO public.event_tags (event_id, tag_id)
        VALUES (v_event_id, (v_tag->>'tag_id')::uuid)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 6. Insert Cohosts
  IF cohosts IS NOT NULL AND jsonb_array_length(cohosts) > 0 THEN
    FOR v_cohost IN SELECT * FROM jsonb_array_elements(cohosts) LOOP
      IF (v_cohost->>'host_user_id') IS NOT NULL THEN
        INSERT INTO public.event_cohosts (event_id, host_user_id, role, is_confirmed)
        VALUES (
          v_event_id,
          (v_cohost->>'host_user_id')::uuid,
          COALESCE(v_cohost->>'role', 'Organiser'),
          COALESCE((v_cohost->>'is_confirmed')::boolean, false)
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 7. Insert Age Restrictions
  IF age_restrictions IS NOT NULL AND jsonb_array_length(age_restrictions) > 0 THEN
    FOR v_age IN SELECT * FROM jsonb_array_elements(age_restrictions) LOOP
      INSERT INTO public.event_age_restrictions (event_id, restriction_text, min_age)
      VALUES (
        v_event_id,
        COALESCE(v_age->>'restriction_text', 'General Audience'),
        NULLIF(v_age->>'min_age', '')::integer
      );
    END LOOP;
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 6. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_discount_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_age_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_rating ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_reviews ENABLE ROW LEVEL SECURITY;

-- Grants for service_role and anon/authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT INSERT ON public.host_applications TO anon, authenticated;
GRANT SELECT ON public.venue_partners TO anon, authenticated;
GRANT SELECT ON public.v_host_profile TO anon, authenticated;
GRANT SELECT ON public.v_events_public TO anon, authenticated;
GRANT SELECT ON public.v_ticket_availability TO anon, authenticated;

COMMIT;
