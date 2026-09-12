import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { scrapeEventFromUrl, ScrapedEventData } from '@/lib/scraper/extractor';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const CITY_CULTURE_SYSTEM_HOST_ID = '88d202b1-5000-45e3-8085-22418bafde74';

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return true; // Allowed in dev if not explicitly set
  const provided = req.headers.get('x-internal-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  return provided === secret;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySecret(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid internal secret' }, { status: 401 });
    }

    const body = await request.json();
    const urls: string[] = [];

    if (body.url && typeof body.url === 'string') {
      urls.push(body.url.trim());
    } else if (Array.isArray(body.urls)) {
      urls.push(...body.urls.filter((u: any) => typeof u === 'string' && u.trim().length > 0));
    }

    if (urls.length === 0 && !body.event) {
      return NextResponse.json({ error: 'At least one URL or event payload is required' }, { status: 400 });
    }

    // Fetch existing categories for mapping
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, slug, name');

    const defaultCategoryId = categories && categories.length > 0 ? categories[0].id : null;
    if (!defaultCategoryId) {
      return NextResponse.json({ error: 'No categories available in database' }, { status: 500 });
    }

    const results: Array<{
      url: string;
      status: 'created' | 'updated' | 'failed';
      eventId?: string;
      slug?: string;
      title?: string;
      error?: string;
    }> = [];

    const itemsToProcess: Array<{ url: string; data?: ScrapedEventData }> = [];
    if (urls.length > 0) {
      for (const u of urls) itemsToProcess.push({ url: u });
    } else if (body.event) {
      itemsToProcess.push({ url: body.event.source_event_url || 'manual', data: body.event });
    }

    for (const item of itemsToProcess) {
      try {
        let scraped: ScrapedEventData;
        if (item.data) {
          scraped = item.data;
        } else {
          scraped = await scrapeEventFromUrl(item.url);
        }

        // 1. Deduplication check via source_event_url
        const { data: existingEvent } = await supabaseAdmin
          .from('events')
          .select('id, slug, title')
          .eq('source_event_url', scraped.source_event_url)
          .maybeSingle();

        if (existingEvent) {
          // Update event details (freshness sync)
          await supabaseAdmin
            .from('events')
            .update({
              title: scraped.title || existingEvent.title,
              start_datetime: scraped.start_datetime,
              end_datetime: scraped.end_datetime || null,
              external_ticket_url: scraped.source_event_url,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', existingEvent.id);

          results.push({
            url: item.url,
            status: 'updated',
            eventId: existingEvent.id,
            slug: existingEvent.slug,
            title: scraped.title,
          });
          continue;
        }

        // 2. Image mirroring via Cloudinary if available
        let processedImageUrl = scraped.image_url || null;
        if (scraped.image_url) {
          try {
            const uploadRes = await uploadToCloudinary(scraped.image_url, 'event-posters');
            if (uploadRes && uploadRes.secure_url) {
              processedImageUrl = uploadRes.secure_url;
            }
          } catch (imgErr) {
            console.warn('Could not mirror image to Cloudinary, using original image url fallback:', imgErr);
            // Fallback directly to scraped.image_url
          }
        }

        // 3. Category Resolution
        let categoryId = body.category_id;
        if (!categoryId && scraped.suggested_category_slug) {
          const matched = categories?.find(c => c.slug === scraped.suggested_category_slug);
          if (matched) categoryId = matched.id;
        }
        if (!categoryId) categoryId = defaultCategoryId;

        // 4. Location Creation
        let locationId: string | null = null;
        if (scraped.venue_name || scraped.venue_address || scraped.city) {
          const { data: loc } = await supabaseAdmin
            .from('locations')
            .insert({
              venue_name: scraped.venue_name || 'City Venue',
              address_line1: scraped.venue_address || null,
              city: body.city || scraped.city || 'Bengaluru',
              country: 'India',
            })
            .select('id')
            .single();

          if (loc) locationId = loc.id;
        }

        // 5. Generate Slug
        const baseSlug = scraped.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 50);
        const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        // 6. Insert Event
        const { data: createdEvent, error: insertError } = await supabaseAdmin
          .from('events')
          .insert({
            title: scraped.title,
            slug: uniqueSlug,
            short_description: scraped.description.slice(0, 160),
            description: scraped.description,
            category_id: categoryId,
            location_id: locationId,
            host_id: CITY_CULTURE_SYSTEM_HOST_ID,
            status: 'published', // auto-publish as configured
            ticketing_mode: 'external',
            external_ticket_url: scraped.source_event_url,
            is_curated: true,
            source_platform: scraped.source_platform,
            source_event_url: scraped.source_event_url,
            claim_status: 'unclaimed',
            cover_image_url: processedImageUrl,
            start_datetime: scraped.start_datetime,
            end_datetime: scraped.end_datetime || scraped.start_datetime,
            timezone: 'Asia/Kolkata',
            published_at: new Date().toISOString(),
          } as any)
          .select('id, slug, title')
          .single();

        if (insertError) {
          throw insertError;
        }

        // 7. Insert Ticket Tier Guide
        if (scraped.price !== undefined) {
          await supabaseAdmin.from('ticket_tiers').insert({
            event_id: createdEvent.id,
            name: 'Standard Ticket',
            description: `Book directly via ${scraped.source_platform.toUpperCase()}`,
            price: scraped.price,
            tier_type: scraped.price > 0 ? 'paid' : 'free',
            total_quantity: 100,
            is_active: true,
          } as any);
        }

        results.push({
          url: item.url,
          status: 'created',
          eventId: createdEvent.id,
          slug: createdEvent.slug,
          title: createdEvent.title,
        });
      } catch (err: any) {
        console.error(`Error processing curated event for URL ${item.url}:`, err);
        results.push({
          url: item.url,
          status: 'failed',
          error: err.message || 'Scrape and sync failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (err: any) {
    console.error('Fatal API /api/curated-events/sync error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
