import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, email, phone, organizationName, evidenceUrl, message } = body;

    if (!eventId || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Event ID, full name, email, and verification message are required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id, title, is_curated')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Insert claim report
    const { error: reportError } = await supabaseAdmin
      .from('curation_reports')
      .insert({
        event_id: eventId,
        report_type: 'claim',
        reporter_name: name.trim(),
        reporter_email: email.trim().toLowerCase(),
        reporter_phone: phone?.trim() || null,
        organization_name: organizationName?.trim() || null,
        evidence_url: evidenceUrl?.trim() || null,
        message: message.trim(),
        status: 'pending',
      });

    if (reportError) {
      console.error('Failed to log claim report:', reportError);
      return NextResponse.json({ error: 'Failed to submit claim request' }, { status: 500 });
    }

    // Update claim status on event
    await supabaseAdmin
      .from('events')
      .update({ claim_status: 'claim_requested' } as any)
      .eq('id', eventId);

    return NextResponse.json({
      success: true,
      message: 'Claim request submitted successfully. Our curation team will verify your ownership and contact you within 24 hours.',
    });
  } catch (err: any) {
    console.error('Error in /api/curated-events/claim:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
