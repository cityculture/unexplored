import * as cheerio from 'cheerio';

export interface ScrapedEventData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime?: string;
  venue_name?: string;
  venue_address?: string;
  city?: string;
  image_url?: string;
  price?: number;
  currency?: string;
  source_platform: 'bookmyshow' | 'insider' | 'eventbrite' | 'meetup' | 'luma' | 'allevents' | 'web';
  source_event_url: string;
  suggested_category_slug?: string;
}

const KNOWN_CITIES = [
  'mumbai', 'delhi', 'bengaluru', 'bangalore', 'pune', 'hyderabad',
  'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
  'goa', 'indore', 'nagpur', 'kochi', 'coimbatore', 'patna', 'vadodara', 'surat'
];

export function detectPlatform(url: string): ScrapedEventData['source_platform'] {
  const u = url.toLowerCase();
  if (u.includes('bookmyshow.com')) return 'bookmyshow';
  if (u.includes('insider.in') || u.includes('district.in')) return 'insider';
  if (u.includes('eventbrite.')) return 'eventbrite';
  if (u.includes('meetup.com')) return 'meetup';
  if (u.includes('lu.ma')) return 'luma';
  if (u.includes('allevents.in')) return 'allevents';
  return 'web';
}

export function detectCity(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(lower)) {
      if (city === 'bangalore') return 'Bengaluru';
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return undefined;
}

export function mapCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/music|concert|band|dj|acoustic|rock|jazz|edm|live music/i.test(lower)) return 'music-concerts';
  if (/comedy|standup|stand-up|theatre|play|drama|open mic/i.test(lower)) return 'theatre-comedy';
  if (/party|nightlife|club|pub|bar|rave|dj night/i.test(lower)) return 'parties-nightlife';
  if (/art|culture|painting|exhibition|heritage|pottery|museum|gallery/i.test(lower)) return 'art-culture';
  if (/workshop|masterclass|class|bootcamp|learn|training/i.test(lower)) return 'workshops-classes';
  if (/tech|coding|developer|hackathon|ai|crypto|software|startup/i.test(lower)) return 'tech-innovation';
  if (/networking|meetup|founders|community|business|conference/i.test(lower)) return 'meetups-networking';
  if (/fitness|sports|yoga|marathon|run|badminton|football|cricket|wellness/i.test(lower)) return 'sports-fitness';
  if (/food|drink|culinary|tasting|wine|beer|buffet|dining/i.test(lower)) return 'food-drinks';
  if (/kids|family|children|parenting/i.test(lower)) return 'family-kids';
  if (/travel|trek|trekking|camping|adventure|hike/i.test(lower)) return 'travel-adventure';
  return 'art-culture'; // default fallback
}

export async function scrapeEventFromUrl(targetUrl: string): Promise<ScrapedEventData> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CityCultureBot/1.0 (+https://cityculture.in/bot)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const response = await fetch(targetUrl, {
    headers,
    redirect: 'follow',
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status}): ${response.statusText}`);
  }

  const html = await response.text();
  return parseHtmlToEvent(html, targetUrl);
}

export function parseHtmlToEvent(html: string, targetUrl: string): ScrapedEventData {
  const platform = detectPlatform(targetUrl);
  const $ = cheerio.load(html);

  let title = '';
  let description = '';
  let startDate = '';
  let endDate = '';
  let venueName = '';
  let venueAddress = '';
  let city: string | undefined;
  let imageUrl = '';
  let price: number | undefined;
  let currency = 'INR';

  // 1. Try extracting JSON-LD Schema.org Event data (Most reliable standard across event platforms)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()?.trim();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);

      for (const item of items) {
        const type = String(item['@type'] || '');
        if (/Event|MusicEvent|TheaterEvent|ComedyEvent|DanceEvent|Festival|VisualArtsEvent|SocialEvent/i.test(type)) {
          if (!title && item.name) title = String(item.name).trim();
          if (!description && item.description) description = String(item.description).trim();
          if (!startDate && item.startDate) startDate = String(item.startDate);
          if (!endDate && item.endDate) endDate = String(item.endDate);

          // Image
          if (!imageUrl && item.image) {
            if (typeof item.image === 'string') imageUrl = item.image;
            else if (Array.isArray(item.image) && item.image.length > 0) imageUrl = item.image[0];
            else if (typeof item.image === 'object' && item.image.url) imageUrl = item.image.url;
          }

          // Location
          if (item.location) {
            const loc = item.location;
            if (typeof loc === 'string') {
              venueName = loc;
            } else if (typeof loc === 'object') {
              if (loc.name) venueName = String(loc.name);
              if (loc.address) {
                if (typeof loc.address === 'string') {
                  venueAddress = loc.address;
                } else if (typeof loc.address === 'object') {
                  const addr = loc.address;
                  venueAddress = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', ');
                  if (addr.addressLocality) city = String(addr.addressLocality);
                }
              }
            }
          }

          // Offers / Pricing
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers && offers.price !== undefined) {
              const p = parseFloat(String(offers.price));
              if (!isNaN(p)) price = p;
            }
            if (offers && offers.priceCurrency) currency = String(offers.priceCurrency);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors for non-matching scripts
    }
  });

  // 2. OpenGraph & Meta fallbacks
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text().split('|')[0]?.split('•')[0]?.trim() || '';
  }

  if (!description) {
    description = $('meta[property="og:description"]').attr('content') ||
                  $('meta[name="description"]').attr('content') ||
                  $('meta[name="twitter:description"]').attr('content') || '';
  }

  if (!imageUrl) {
    imageUrl = $('meta[property="og:image"]').attr('content') ||
               $('meta[name="twitter:image"]').attr('content') || '';
  }

  // 3. Fallback City Detection
  if (!city) {
    city = detectCity(targetUrl) || detectCity(title) || (venueAddress ? detectCity(venueAddress) : undefined) || detectCity(description);
  }

  // 4. Default start date to upcoming weekend if not parsed
  if (!startDate) {
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7));
    nextSaturday.setHours(18, 0, 0, 0);
    startDate = nextSaturday.toISOString();
  }

  // Format valid ISO dates
  let validStart = new Date(startDate).toISOString();
  if (isNaN(new Date(validStart).getTime())) {
    validStart = new Date().toISOString();
  }

  let validEnd: string | undefined;
  if (endDate) {
    const parsedEnd = new Date(endDate).toISOString();
    if (!isNaN(new Date(parsedEnd).getTime())) {
      validEnd = parsedEnd;
    }
  }

  if (!title) {
    title = 'Curated Cultural Experience';
  }

  const combinedText = `${title} ${description} ${venueName}`;
  const suggestedCategorySlug = mapCategory(combinedText);

  return {
    title: title.replace(/\s+/g, ' ').trim(),
    description: description ? description.replace(/<[^>]*>?/gm, '').trim() : 'Join us for this curated experience.',
    start_datetime: validStart,
    end_datetime: validEnd,
    venue_name: venueName || undefined,
    venue_address: venueAddress || undefined,
    city: city || 'Bengaluru',
    image_url: imageUrl || undefined,
    price: price,
    currency: currency,
    source_platform: platform,
    source_event_url: targetUrl,
    suggested_category_slug: suggestedCategorySlug
  };
}
