-- Migration: Add external source and tier sync columns
-- Description: Enables idempotent event and ticket tier synchronization from partner platforms like Stranger Mingle.

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS external_source VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS external_event_id VARCHAR(100) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external_source_id 
ON public.events(external_source, external_event_id) 
WHERE external_source IS NOT NULL;

ALTER TABLE public.ticket_tiers
ADD COLUMN IF NOT EXISTS external_tier_id VARCHAR(100) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_external_tier_id 
ON public.ticket_tiers(external_tier_id) 
WHERE external_tier_id IS NOT NULL;
