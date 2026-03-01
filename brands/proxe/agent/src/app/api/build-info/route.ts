import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.1'
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()

  const buildDate = new Date(buildTimestamp).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return NextResponse.json({ version, buildTimestamp, buildDate })
}
