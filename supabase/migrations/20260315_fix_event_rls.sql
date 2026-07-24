-- BEGIN;

-- 1. Management policy for event_agenda
-- Allows hosts to manage agenda for their own events.
DROP POLICY IF EXISTS "Hosts manage own event agenda" ON public.event_agenda;
CREATE POLICY "Hosts manage own event agenda" ON public.event_agenda
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 2. Management policy for event_faqs
-- Allows hosts to manage FAQs for their own events.
DROP POLICY IF EXISTS "Hosts manage own event faqs" ON public.event_faqs;
CREATE POLICY "Hosts manage own event faqs" ON public.event_faqs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 3. Management policy for event_tags
-- Allows hosts to manage tags for their own events.
DROP POLICY IF EXISTS "Hosts manage own event tags" ON public.event_tags;
CREATE POLICY "Hosts manage own event tags" ON public.event_tags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 4. Tag creation policy for hosts
-- Allows hosts to create new tags if they don't exist.
DROP POLICY IF EXISTS "Hosts can create tags" ON public.tags;
CREATE POLICY "Hosts can create tags" ON public.tags
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'host' OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 5. Ensure existing SELECT policies are public (should be already but just in case)
DROP POLICY IF EXISTS "Event agenda visibility" ON public.event_agenda;
CREATE POLICY "Event agenda visibility" ON public.event_agenda FOR SELECT USING (true);

DROP POLICY IF EXISTS "Event faqs visibility" ON public.event_faqs;
CREATE POLICY "Event faqs visibility" ON public.event_faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Event tags visibility" ON public.event_tags;
CREATE POLICY "Event tags visibility" ON public.event_tags FOR SELECT USING (true);

-- COMMIT;

-- ROLLBACK:
-- DROP POLICY IF EXISTS "Hosts manage own event agenda" ON public.event_agenda;
-- DROP POLICY IF EXISTS "Hosts manage own event faqs" ON public.event_faqs;
-- DROP POLICY IF EXISTS "Hosts manage own event tags" ON public.event_tags;
-- DROP POLICY IF EXISTS "Hosts can create tags" ON public.tags;
