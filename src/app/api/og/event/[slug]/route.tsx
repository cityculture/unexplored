import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const supabase = supabaseAdmin
    const { data: event } = await supabase
      .from('v_events_public')
      .select('title, start_datetime, city, cover_image_url, category_name, host_display_name')
      .eq('slug', slug)
      .single()

    if (!event) {
      return new Response('Not Found', { status: 404 })
    }

    const date = new Date(event.start_datetime || '').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #f5f3ff 0%, transparent 50%), radial-gradient(circle at 75% 75%, #eef2ff 0%, transparent 50%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '900px',
              height: '500px',
              backgroundColor: '#fff',
              borderRadius: '40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Left side: Image or Accent */}
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
              <img
                src={event.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: '30px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  color: '#fff',
                  fontSize: '20px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {event.category_name}
              </div>
            </div>

            {/* Bottom side: Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '40px 50px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ fontSize: '24px', color: '#6366f1', fontWeight: '800' }}>
                  {date}
                </div>
                <div style={{ fontSize: '24px', color: '#9ca3af' }}>•</div>
                <div style={{ fontSize: '24px', color: '#4b5563', fontWeight: '600' }}>
                  {event.city}
                </div>
              </div>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#111827',
                  lineHeight: '1.1',
                  marginBottom: '20px',
                }}
              >
                {event.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '20px', color: '#6b7280' }}>Hosted by</div>
                <div style={{ fontSize: '22px', color: '#111827', fontWeight: '700' }}>
                {event.host_display_name}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <img src="https://www.cityculture.in/logo.png" width="40" height="40" style={{ borderRadius: '10px' }} />
             <div style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937' }}>City Culture</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error(e.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
