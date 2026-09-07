import { createClient } from '@supabase/supabase-js';

// Stranger Mingle Supabase client
const smUrl = 'https://uuanzogrkoomekskvxab.supabase.co';
const smKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YW56b2dya29vbWVrc2t2eGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxNzcxMywiZXhwIjoyMDg4NTkzNzEzfQ.7nikLlaSNSRB0KZsfMgFMa-rLgy0YzZv-27-ElJshng';
const smSupabase = createClient(smUrl, smKey);

// City Culture Supabase client
const ccUrl = 'https://kvhjzpqkzydvjwdtqswr.supabase.co';
const ccKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aGp6cHFrenlkdmp3ZHRxc3dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEyNTY1NCwiZXhwIjoyMDg4NzAxNjU0fQ.6R61ojV93hNuMXpcqxxyWxNlCjdjZ_PiPBpfc0md-g4';
const ccSupabase = createClient(ccUrl, ccKey);

// Host attribution in City Culture
const CC_HOST_USER_ID = 'bc4a046a-2dfa-480a-9983-7f473c81bf57'; // strangermingleteam@gmail.com
const CC_HOST_PAGE_ID = '40f05b7d-b254-4212-b89d-00ff0af1f14f'; // Stranger Mingle Host Page

// Category Mapping (Stranger Mingle slug -> City Culture slug)
const CATEGORY_MAP = {
  'meetups': 'meetups-networking',
  'music-concerts': 'music-concerts',
  'parties-nightlife': 'parties-nightlife',
  'workshops-classes': 'workshops-classes',
  'food-drinks': 'food-drinks',
  'art-culture': 'art-culture',
  'sports-fitness': 'sports-fitness',
  'tech-innovation': 'tech-innovation',
  'family-kids': 'family-kids',
  'comedy-theatre': 'theatre-comedy',
  'theatre-comedy': 'theatre-comedy',
  'travel-adventure': 'travel-adventure',
  'health-wellness': 'health-wellness',
  'online-events': 'meetups-networking',
  'other': 'meetups-networking',
};

async function backfillEvents() {
  console.log('🚀 Starting Stranger Mingle -> City Culture Event Migration...');

  // 1. Load City Culture categories
  const { data: ccCategories, error: catErr } = await ccSupabase.from('categories').select('id, slug');
  if (catErr) throw catErr;
  const categoryMap = new Map(ccCategories.map(c => [c.slug, c.id]));
  const defaultCategoryId = categoryMap.get('meetups-networking');

  // 2. Fetch ONLY PUBLISHED events from Stranger Mingle
  const { data: smEvents, error: smErr } = await smSupabase
    .from('events')
    .select('*, locations(*), ticket_tiers(*), categories(*)')
    .eq('status', 'published');

  if (smErr) throw smErr;
  console.log(`Found ${smEvents.length} published events in Stranger Mingle.`);

  let importedCount = 0;
  let skippedCount = 0;

  for (const smEvent of smEvents) {
    console.log(`\nProcessing: "${smEvent.title}" (SM ID: ${smEvent.id})`);

    // Check if event already imported by external_source + external_event_id
    const { data: existingEvent } = await ccSupabase
      .from('events')
      .select('id, slug')
      .eq('external_source', 'strangermingle')
      .eq('external_event_id', smEvent.id)
      .maybeSingle();

    // 3. Resolve or Create Location
    let locationId = null;
    if (smEvent.locations) {
      const loc = smEvent.locations;
      const venueName = loc.venue_name || 'City Venue';
      const city = loc.city || 'Pune';

      // Check if location exists in City Culture
      const { data: existingLoc } = await ccSupabase
        .from('locations')
        .select('id')
        .eq('venue_name', venueName)
        .eq('city', city)
        .maybeSingle();

      if (existingLoc) {
        locationId = existingLoc.id;
      } else {
        const { data: newLoc, error: locInsertErr } = await ccSupabase
          .from('locations')
          .insert({
            venue_name: venueName,
            address_line1: loc.address_line1 || loc.address || null,
            address_line2: loc.address_line2 || null,
            city: city,
            state: loc.state || 'Maharashtra',
            country: loc.country || 'India',
            country_code: loc.country_code || 'IN',
            postal_code: loc.postal_code || null,
            latitude: loc.latitude || null,
            longitude: loc.longitude || null,
            google_maps_url: loc.google_maps_url || null,
          })
          .select('id')
          .single();

        if (locInsertErr) {
          console.warn(`  ⚠️ Failed to insert location, continuing with null location:`, locInsertErr.message);
        } else {
          locationId = newLoc.id;
        }
      }
    }

    // 4. Resolve Category
    const smCatSlug = smEvent.categories?.slug || 'meetups';
    const targetSlug = CATEGORY_MAP[smCatSlug] || 'meetups-networking';
    const categoryId = categoryMap.get(targetSlug) || defaultCategoryId;

    // 5. Generate unique slug if not existing
    let slug = smEvent.slug;
    if (!existingEvent) {
      const { data: slugCheck } = await ccSupabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugCheck) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
    } else {
      slug = existingEvent.slug;
    }

    // Format doors_open_at to time without time zone (HH:mm:ss)
    let doorsOpenTime = null;
    if (smEvent.doors_open_at) {
      if (typeof smEvent.doors_open_at === 'string' && smEvent.doors_open_at.includes('T')) {
        const match = smEvent.doors_open_at.match(/T(\d{2}:\d{2}:\d{2})/);
        doorsOpenTime = match ? match[1] : null;
      } else {
        doorsOpenTime = smEvent.doors_open_at;
      }
    }

    // 6. Event payload
    const eventPayload = {
      title: smEvent.title,
      slug: slug,
      host_id: CC_HOST_USER_ID,
      host_page_id: CC_HOST_PAGE_ID,
      category_id: categoryId,
      location_id: locationId,
      short_description: smEvent.short_description || smEvent.title,
      description: smEvent.description || smEvent.short_description || smEvent.title,
      cover_image_url: smEvent.cover_image_url || null,
      vertical_poster_url: smEvent.vertical_poster_url || smEvent.cover_image_url || null,
      event_type: smEvent.event_type || (smEvent.locations?.city ? 'in_person' : 'online'),
      ticketing_mode: 'platform', // City Culture sells tickets directly
      status: 'published',
      start_datetime: smEvent.start_datetime,
      end_datetime: smEvent.end_datetime,
      timezone: smEvent.timezone || 'Asia/Kolkata',
      doors_open_at: doorsOpenTime,
      max_capacity: smEvent.max_capacity || 30,
      is_age_restricted: smEvent.is_age_restricted || false,
      min_age: smEvent.min_age || 0,
      refund_policy: smEvent.refund_policy || 'no_refund',
      refund_policy_text: smEvent.refund_policy_text || null,
      is_featured: smEvent.is_featured || false,
      is_sponsored: smEvent.is_sponsored || false,
      external_source: 'strangermingle',
      external_event_id: smEvent.id,
      published_at: smEvent.published_at || new Date().toISOString(),
    };

    let targetEventId = null;

    if (existingEvent) {
      console.log(`  Updating existing City Culture event (${existingEvent.id})...`);
      const { data: updated, error: updateErr } = await ccSupabase
        .from('events')
        .update(eventPayload)
        .eq('id', existingEvent.id)
        .select('id')
        .single();

      if (updateErr) {
        console.error(`  ❌ Update error:`, updateErr.message);
        continue;
      }
      targetEventId = updated.id;
    } else {
      console.log(`  Inserting new City Culture event...`);
      const { data: inserted, error: insertErr } = await ccSupabase
        .from('events')
        .insert(eventPayload)
        .select('id')
        .single();

      if (insertErr) {
        console.error(`  ❌ Insert error:`, insertErr.message);
        continue;
      }
      targetEventId = inserted.id;
    }

    // 7. Sync Ticket Tiers
    const smTiers = smEvent.ticket_tiers || [];
    console.log(`  Syncing ${smTiers.length} ticket tiers...`);

    for (const smTier of smTiers) {
      const tierPayload = {
        event_id: targetEventId,
        external_tier_id: smTier.id,
        name: smTier.name,
        description: smTier.description || null,
        tier_type: smTier.tier_type || (smTier.price > 0 ? 'paid' : 'free'),
        tier_category: smTier.name.toLowerCase().includes('girl') ? 'Girls' :
                       smTier.name.toLowerCase().includes('boy') ? 'Boys' :
                       smTier.name.toLowerCase().includes('couple') ? 'Couple' : 'General',
        price: smTier.price || 0,
        currency: smTier.currency || 'INR',
        total_quantity: smTier.total_quantity || 20,
        sold_count: smTier.sold_count || 0,
        max_per_booking: smTier.max_per_booking || 5,
        min_per_booking: smTier.min_per_booking || 1,
        is_active: smTier.is_active !== false,
        sort_order: smTier.sort_order || 0,
      };

      // Check if tier already exists for this event
      const { data: existingTier } = await ccSupabase
        .from('ticket_tiers')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('external_tier_id', smTier.id)
        .maybeSingle();

      if (existingTier) {
        await ccSupabase
          .from('ticket_tiers')
          .update(tierPayload)
          .eq('id', existingTier.id);
      } else {
        await ccSupabase
          .from('ticket_tiers')
          .insert(tierPayload);
      }
    }

    importedCount++;
    console.log(`  ✅ Successfully synced event and tiers.`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 Migration Complete!`);
  console.log(`Total Published Events Synced: ${importedCount}`);
  console.log(`========================================`);
}

backfillEvents().catch(console.error);
