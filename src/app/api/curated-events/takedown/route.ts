import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, email, reason, message } = body;

    if (!eventId || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Event ID, reporter name, email, and message are required' },
        { status: 400 }
      );
    }

    const reportType = reason === 'inaccurate_info' ? 'inaccurate_info' : 'takedown';

    // Verify event exists
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id, title, is_curated, status')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Insert takedown report
    const { error: reportError } = await supabaseAdmin
      .from('curation_reports')
      .insert({
        event_id: eventId,
        report_type: reportType,
        reporter_name: name.trim(),
        reporter_email: email.trim().toLowerCase(),
        message: message.trim(),
        status: 'pending',
      });

    if (reportError) {
      console.error('Failed to log takedown report:', reportError);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    // Ethical safeguard: If a direct takedown/removal request is made, unpublish immediately
    if (reportType === 'takedown') {
      await supabaseAdmin
        .from('events')
        .update({ status: 'under_review' } as any)
        .eq('id', eventId);
    }

    return NextResponse.json({
      success: true,
      message: reportType === 'takedown'
        ? 'Takedown request received. The event has been immediately removed from public listing while our team reviews the request.'
        : 'Thank you for reporting inaccurate information. Our editorial team will review the details promptly.',
    });
  } catch (err: any) {
    console.error('Error in /api/curated-events/takedown:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
