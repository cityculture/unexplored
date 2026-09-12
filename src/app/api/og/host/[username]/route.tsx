import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  try {
    const supabase = supabaseAdmin
    const { data: host, error } = await supabase
      .from('users')
      .select(`
        organisation_name,
        full_name,
        bio,
        avatar_url,
        follower_count
      `)
      .eq('username', username)
      .single()

    if (error || !host) {
      return new Response('Not Found', { status: 404 })
    }

    const hostData = host as unknown as {
      organisation_name: string | null;
      full_name: string | null;
      bio: string | null;
      avatar_url: string | null;
      follower_count: number | null;
    }

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
            backgroundColor: '#000',
            backgroundImage: 'linear-gradient(to bottom right, #1e1b4b, #000)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '800px',
              padding: '60px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '60px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <img
              src={hostData.avatar_url || 'https://www.cityculture.in/placeholder-avatar.jpg'}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                border: '6px solid #4f46e5',
                marginBottom: '30px',
              }}
            />
            
            <div style={{ fontSize: '56px', fontWeight: '900', color: '#fff', marginBottom: '10px', textAlign: 'center' }}>
              {hostData.organisation_name || hostData.full_name}
            </div>
            
            <div style={{ fontSize: '28px', color: '#a5b4fc', marginBottom: '40px', textAlign: 'center' }}>
              {hostData.bio || 'Verified Host on City Culture'}
            </div>
 
            <div style={{ display: 'flex', gap: '60px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff' }}>{hostData.follower_count}</div>
                <div style={{ fontSize: '18px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '50px', display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>City Culture</div>
             <div style={{ fontSize: '24px', color: '#6366f1' }}>Host Profile</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: unknown) {
    return new Response('Internal Server Error', { status: 500 })
  }
}
