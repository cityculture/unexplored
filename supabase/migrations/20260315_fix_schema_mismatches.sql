-- BEGIN;

-- 1. Add missing 'full_name' column to 'users' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name VARCHAR(255);
    END IF;
END $$;

-- 2. Add missing 'slug' column to 'host_pages' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_pages' AND column_name = 'slug') THEN
        ALTER TABLE public.host_pages ADD COLUMN slug VARCHAR(320) UNIQUE;
    END IF;
END $$;

-- 3. Create 'subscriptions' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    host_page_id                UUID NOT NULL REFERENCES public.host_pages(id) ON DELETE CASCADE,
    plan_type                   VARCHAR(50) NOT NULL, -- 'monthly', 'yearly'
    amount                      DECIMAL(10,2) NOT NULL,
    currency                    VARCHAR(10) DEFAULT 'INR',
    status                      VARCHAR(20) DEFAULT 'active',
    starts_at                   TIMESTAMP NOT NULL DEFAULT NOW(),
    ends_at                     TIMESTAMP NOT NULL,
    razorpay_payment_id         VARCHAR(255),
    razorpay_subscription_id    VARCHAR(255),
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

-- 4. Add RLS for 'subscriptions'
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions') THEN
        CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Add indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_host_page_id ON public.subscriptions(host_page_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id ON public.subscriptions(razorpay_subscription_id);

-- COMMIT;

-- ROLLBACK:
-- ALTER TABLE public.users DROP COLUMN IF EXISTS full_name;
-- ALTER TABLE public.host_pages DROP COLUMN IF EXISTS slug;
-- DROP TABLE IF EXISTS public.subscriptions;
