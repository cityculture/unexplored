-- BEGIN;

-- Add missing INSERT policy to allow users to initialize their profile upon sign-up
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- COMMIT;

-- ROLLBACK:
-- DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
