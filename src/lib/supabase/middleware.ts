import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  return { supabaseResponse, user: null }
}
