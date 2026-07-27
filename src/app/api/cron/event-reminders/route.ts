import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { sendNotification } from '../../../../lib/notifications/send';

/**
 * Vercel Cron handler to send event reminders.
 * Runs hourly to find events starting in ~24 hours and ~1 hour.
 */
export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  try {
    // 2. Fetch events starting in 24 hours (23h to 25h range)
    const { data: reminder24hEvents, error: err24h } = await supabase
      .from('events')
      .select('id, title, start_datetime, locations(venue_name)')
      .filter('start_datetime', 'gte', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString())
      .filter('start_datetime', 'lte', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString());

    if (err24h) throw err24h;

    // 3. Fetch events starting in 1 hour (0h to 2h range)
    const { data: reminder1hEvents, error: err1h } = await supabase
      .from('events')
      .select('id, title, start_datetime, locations(venue_name)')
      .filter('start_datetime', 'gte', new Date(Date.now() + 0 * 60 * 60 * 1000).toISOString())
      .filter('start_datetime', 'lte', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());

    if (err1h) throw err1h;

    const results = {
      reminder24h: 0,
      reminder1h: 0,
      errors: 0
    };

    // Process 24h reminders
    if (reminder24hEvents) {
      for (const event of reminder24hEvents) {
        const venue = (event.locations as unknown as { venue_name: string } | null)?.venue_name || 'the venue';
        const { data: bookings } = await supabase
          .from('bookings')
          .select('user_id')
          .eq('event_id', event.id)
          .eq('status', 'confirmed');

        if (bookings) {
          for (const booking of bookings) {
            const res = await sendNotification(booking.user_id, 'event_reminder_24h', {
              event_title: event.title,
              event_location: venue
            });
            if (res.success) results.reminder24h++;
            else results.errors++;
          }
        }
      }
    }

    // Process 1h reminders
    if (reminder1hEvents) {
      for (const event of reminder1hEvents) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('user_id')
          .eq('event_id', event.id)
          .eq('status', 'confirmed');

        if (bookings) {
          for (const booking of bookings) {
            const res = await sendNotification(booking.user_id, 'event_reminder_1h', {
              event_title: event.title
            });
            if (res.success) results.reminder1h++;
            else results.errors++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
