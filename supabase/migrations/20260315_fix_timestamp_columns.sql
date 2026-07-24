-- BEGIN;

-- 1. Fix event_agenda timestamps (converting to TIME)
ALTER TABLE public.event_agenda ALTER COLUMN starts_at TYPE TIME USING starts_at::TIME;
ALTER TABLE public.event_agenda ALTER COLUMN ends_at TYPE TIME USING ends_at::TIME;

-- 2. Fix events.doors_open_at (converting to TIME)
ALTER TABLE public.events ALTER COLUMN doors_open_at TYPE TIME USING doors_open_at::TIME;

-- 3. Fix ticket_tiers sale times (converting to TIME)
ALTER TABLE public.ticket_tiers ALTER COLUMN sale_start_at TYPE TIME USING sale_start_at::TIME;
ALTER TABLE public.ticket_tiers ALTER COLUMN sale_end_at TYPE TIME USING sale_end_at::TIME;

-- COMMIT;

-- ROLLBACK:
-- ALTER TABLE public.event_agenda ALTER COLUMN starts_at TYPE TIMESTAMP USING starts_at::TIMESTAMP;
-- ALTER TABLE public.event_agenda ALTER COLUMN ends_at TYPE TIMESTAMP USING ends_at::TIMESTAMP;
-- ALTER TABLE public.events ALTER COLUMN doors_open_at TYPE TIMESTAMP USING doors_open_at::TIMESTAMP;
-- ALTER TABLE public.ticket_tiers ALTER COLUMN sale_start_at TYPE TIMESTAMP USING sale_start_at::TIMESTAMP;
-- ALTER TABLE public.ticket_tiers ALTER COLUMN sale_end_at TYPE TIMESTAMP USING sale_end_at::TIMESTAMP;
