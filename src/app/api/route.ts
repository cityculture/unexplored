import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'City Culture API',
    version: '1.0.0',
    status: 'ok',
    docs: 'https://docs.cityculture.in',
  })
}
