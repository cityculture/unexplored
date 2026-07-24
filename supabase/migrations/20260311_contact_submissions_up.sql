-- Migration: Create Contact Submissions Table for API Route

BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(50),
  message text,
  submission_type character varying(50) NOT NULL DEFAULT 'contact'::character varying,
  source character varying(100),
  status character varying(50) NOT NULL DEFAULT 'new'::character varying,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);

-- RLS policies
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the contact form)
CREATE POLICY "Allow public inserts for contact_submissions" ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to read/update
CREATE POLICY "Allow admins to view contact_submissions" ON public.contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update contact_submissions" ON public.contact_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

COMMIT;

-- ROLLBACK INSTRUCTIONS
-- BEGIN;
-- DROP POLICY IF EXISTS "Allow admins to update contact_submissions" ON public.contact_submissions;
-- DROP POLICY IF EXISTS "Allow admins to view contact_submissions" ON public.contact_submissions;
-- DROP POLICY IF EXISTS "Allow public inserts for contact_submissions" ON public.contact_submissions;
-- DROP TABLE IF EXISTS public.contact_submissions;
-- COMMIT;
