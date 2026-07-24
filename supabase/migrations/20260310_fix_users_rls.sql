BEGIN;

-- 1. Ensure the helper function is a SECURITY DEFINER to avoid recursion
-- Note: It was already found to be a security definer in some checks, 
-- but we recreate it to be absolutely sure it doesn't query the table under the caller's RLS.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
    RETURN (SELECT role::text FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies on users table
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- 3. Re-create "read own record" policy without calling get_user_role() for the own-record check
-- This avoids the recursion because auth.uid() = id is a direct check.
CREATE POLICY "Users can read own record" 
ON public.users 
FOR SELECT 
USING (
    (auth.uid() = id) 
    OR 
    (public.get_user_role() = 'admin')
);

-- 4. Re-create admin delete policy
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (public.get_user_role() = 'admin');

COMMIT;
