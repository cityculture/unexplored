-- 2. Add missing 'tier_category' column to 'ticket_tiers' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_tiers' AND column_name = 'tier_category') THEN
        ALTER TABLE public.ticket_tiers ADD COLUMN tier_category VARCHAR(50);
    END IF;
END $$;

-- 3. Seed common categories
INSERT INTO public.categories (name, slug, description, color_hex, sort_order) VALUES
  ('Music & Concerts',   'music-concerts',   'Live music, festivals, and concerts across all genres.', '#E74C3C', 1),
  ('Parties & Nightlife','parties-nightlife', 'Clubbing, pub crawls, and the best nightlife experiences.', '#9B59B6', 2),
  ('Workshops & Classes','workshops-classes', 'Learn new skills, from cooking to coding and everything in between.', '#2ECC71', 3),
  ('Meetups & Networking','meetups-networking','Connect with like-minded people at socials and professional mixers.', '#3498DB', 4),
  ('Food & Drinks',      'food-drinks',       'Food festivals, wine tasting, and culinary experiences.', '#F39C12', 5),
  ('Art & Culture',      'art-culture',       'Exhibitions, museum tours, and cultural celebrations.', '#1ABC9C', 6),
  ('Sports & Fitness',   'sports-fitness',    'Marathons, yoga sessions, and sports tournaments.', '#E67E22', 7),
  ('Tech & Innovation',  'tech-innovation',   'Hackathons, tech talks, and future-forward seminars.', '#34495E', 8),
  ('Health & Wellness',  'health-wellness',   'Yoga, meditation, and holistic health retreats.', '#E91E63', 9),
  ('Travel & Adventure', 'travel-adventure',  'Guided tours, treks, and weekend getaways.', '#009688', 10),
  ('Theatre & Comedy',   'theatre-comedy',    'Stand-up comedy, plays, and dramatic performances.', '#673AB7', 11),
  ('Family & Kids',      'family-kids',       'Fun activities and educational events for children.', '#F1C40F', 12)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color_hex = EXCLUDED.color_hex,
    sort_order = EXCLUDED.sort_order;

-- COMMIT;

-- ROLLBACK:
-- DELETE FROM public.categories WHERE slug IN ('music-concerts', 'parties-nightlife', 'workshops-classes', 'meetups-networking', 'food-drinks', 'art-culture', 'sports-fitness', 'tech-innovation', 'health-wellness', 'travel-adventure', 'theatre-comedy', 'family-kids');
