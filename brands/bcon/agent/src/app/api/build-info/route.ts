import { NextResponse } from 'next/server'
import { APP_VERSION, BUILD_TIMESTAMP } from '@/lib/generated-version'

export const dynamic = 'force-dynamic'

export async function GET() {
  const version = APP_VERSION
  const buildTimestamp = BUILD_TIMESTAMP

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
