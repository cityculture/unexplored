BEGIN;

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('allowed', 'denied')),
    denial_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS attendance_logs_event_id_idx ON public.attendance_logs(event_id);
CREATE INDEX IF NOT EXISTS attendance_logs_ticket_id_idx ON public.attendance_logs(ticket_id);

-- Add comments for documentation
COMMENT ON TABLE public.attendance_logs IS 'Logs of ticket check-in attempts at events.';
COMMENT ON COLUMN public.attendance_logs.status IS 'Whether entry was allowed or denied.';

-- Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Hosts can view logs for their own events
CREATE POLICY "Hosts can view attendance logs for their events"
ON public.attendance_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = attendance_logs.event_id
        AND (e.host_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.event_cohosts ec
            WHERE ec.event_id = e.id
            AND ec.host_user_id = auth.uid()
            AND ec.is_confirmed = true
        ))
    )
);

-- 2. Hosts can insert logs for their own events
CREATE POLICY "Hosts can insert attendance logs for their events"
ON public.attendance_logs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = attendance_logs.event_id
        AND (e.host_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.event_cohosts ec
            WHERE ec.event_id = e.id
            AND ec.host_user_id = auth.uid()
            AND ec.is_confirmed = true
        ))
    )
);

COMMIT;

-- Rollback:
-- DROP TABLE IF EXISTS public.attendance_logs;
