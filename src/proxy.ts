import { NextResponse, type NextRequest } from 'next/server'

/**
 * Backend API middleware.
 * - All routes are under /api/*
 * - Auth validation is done per-route using Firebase Admin SDK token verification
 * - No session management or redirects — this is a pure API server
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  // In production, only allow requests from api.cityculture.in
  if (!isLocalhost) {
    const host = hostname.split(':')[0]
    const ALLOWED_HOST = 'api.cityculture.in'

    if (host !== ALLOWED_HOST) {
      return new NextResponse(
        JSON.stringify({ error: 'Access Denied', message: 'This API is only accessible from api.cityculture.in' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Force HTTPS
    if (request.nextUrl.protocol !== 'https:') {
      const httpsUrl = request.nextUrl.clone()
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl)
    }
  }

  // Add CORS headers for cross-origin requests from frontend/admin
  const response = NextResponse.next()
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    'https://www.cityculture.in',
    'https://admin.cityculture.in',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ]
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
