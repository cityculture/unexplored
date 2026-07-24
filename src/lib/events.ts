import { createServerClient } from './supabaseClient';
import { EventWithDetails } from '@/types/api.types';
import { Event } from '@/types';


// PaymentDetail interface (renamed from Booking)
export interface PaymentDetail {
    id: string;
    event_id: string;
    user_id: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    spots_booked: number;
    amount_paid: number;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    created_at: string;
    updated_at: string;
}

// Keep Booking as alias for backward compatibility
export type Booking = PaymentDetail;

// Event status suggestion based on dates and capacity
export function calculateEventStatus(event: Event): string {
    if (event.status === 'cancelled') {
        return 'cancelled';
    }

    const now = new Date();
    const endDate = event.end_datetime ? new Date(event.end_datetime) : now;

    if (endDate < now) {
        return 'completed';
    }

    if (event.max_capacity && (event.booking_count || 0) >= event.max_capacity) {
        return 'completed'; // or 'sold_out' if we had that status
    }

    return event.status || 'draft';
}

export function formatEventPrice(minPrice?: number): string {
    if (!minPrice || minPrice === 0) {
        return 'Free';
    }
    return `₹${minPrice.toFixed(0)}`;
}

export function formatEventDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    };

    if (startDate === endDate) {
        return start.toLocaleDateString('en-IN', options);
    }

    return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
}

export function formatEventTime(startTime: string, endTime: string): string {
    const formatTime = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function getSpotsLabel(event: Event): string {
    if (!event.max_capacity) return 'Open';
    
    const remaining = event.max_capacity - (event.booking_count || 0);

    if (remaining <= 0) {
        return 'Sold Out';
    }

    if (remaining <= 3) {
        return 'Few Left';
    }

    if (remaining <= event.max_capacity * 0.2) {
        return 'Filling Fast';
    }

    if (remaining <= event.max_capacity * 0.5) {
        return 'Limited Spots';
    }

    return 'Open';
}

interface LocationData {
    city: string | null;
    venue_name: string | null;
    address_line1: string | null;
    address_line2: string | null;
}

// Database query functions
export async function getEventsByCity(city: string): Promise<EventWithDetails[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            vertical_poster_url,
            location:locations (*)
        `)
        .ilike('location.city', `%${city}%`)
        .eq('status', 'published')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true });

    if (error) {
        console.error('Error fetching events by city:', error);
        return [];
    }

    // Flatten location fields for easier usage in legacy components
    return (data || []).map(event => ({
        ...event,
        city: (event.location as unknown as LocationData | null)?.city,
        venue_name: (event.location as unknown as LocationData | null)?.venue_name,
        full_address: `${(event.location as unknown as LocationData | null)?.address_line1 || ''} ${(event.location as unknown as LocationData | null)?.address_line2 || ''}`.trim()
    })) as unknown as EventWithDetails[];
}

export async function getAllLiveEvents(): Promise<EventWithDetails[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            vertical_poster_url,
            location:locations (*)
        `)
        .eq('status', 'published')
        .gte('end_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true });

    if (error) {
        console.error('Error fetching all live events:', error);
        return [];
    }

    // Flatten location fields
    return (data || []).map(event => ({
        ...event,
        city: (event.location as unknown as LocationData | null)?.city,
        venue_name: (event.location as unknown as LocationData | null)?.venue_name,
        full_address: `${(event.location as unknown as LocationData | null)?.address_line1 || ''} ${(event.location as unknown as LocationData | null)?.address_line2 || ''}`.trim()
    })) as unknown as EventWithDetails[];
}

export async function getEventById(id: string): Promise<EventWithDetails | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            location:locations (
                city,
                venue_name,
                address_line1,
                address_line2,
                vertical_poster_url
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching event by id:', error);
        return null;
    }

    if (!data) return null;

    return {
        ...data,
        city: (data.location as unknown as LocationData | null)?.city,
        venue_name: (data.location as unknown as LocationData | null)?.venue_name,
        full_address: `${(data.location as unknown as LocationData | null)?.address_line1 || ''} ${(data.location as unknown as LocationData | null)?.address_line2 || ''}`.trim()
    } as unknown as Event;
}

// Public event query - only returns 'live' or 'closed' events (not 'cancelled')
// This prevents unauthorized access to cancelled events via direct URL
export async function getPublicEventById(id: string): Promise<EventWithDetails | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            vertical_poster_url,
            location:locations (*)
        `)
        .eq('id', id)
        .in('status', ['published', 'completed'])
        .single();

    if (error) {
        console.error('Error fetching public event by id:', error);
        return null;
    }

    if (!data) return null;

    return {
        ...data,
        city: (data.location as unknown as LocationData | null)?.city,
        venue_name: (data.location as unknown as LocationData | null)?.venue_name,
        full_address: `${(data.location as unknown as LocationData | null)?.address_line1 || ''} ${(data.location as unknown as LocationData | null)?.address_line2 || ''}`.trim()
    } as unknown as Event;
}

// Public event query by slug - only returns 'live' or 'closed' events (not 'cancelled')
// This is the preferred method for public URLs as slugs are SEO-friendly
// Also supports UUID fallback for backward compatibility (if slug not found and param looks like UUID, try querying by id)
export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
    const supabase = createServerClient();

    if (!slug) {
        console.error('getPublicEventBySlug: slug is empty or undefined');
        return null;
    }

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            vertical_poster_url,
            location:locations (*)
        `)
        .eq('slug', slug)
        .in('status', ['published', 'completed'])
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching public event by slug:', error);
        }
        return null;
    }

    if (!data) return null;

    return {
        ...data,
        city: (data.location as unknown as LocationData | null)?.city,
        venue_name: (data.location as unknown as LocationData | null)?.venue_name,
        full_address: `${(data.location as unknown as LocationData | null)?.address_line1 || ''} ${(data.location as unknown as LocationData | null)?.address_line2 || ''}`.trim()
    } as unknown as Event;
}

