import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // AUTHENTICATION DISABLED - No auth check needed
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()

    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('all_leads')
      .select('*')
      .not('booking_date', 'is', null)
      .not('booking_time', 'is', null)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (startDate) {
      query = query.gte('booking_date', startDate)
    }

    if (endDate) {
      query = query.lte('booking_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Map all_leads columns to the shape the frontend expects
    const bookings = (data || []).map((lead: any) => ({
      ...lead,
      name: lead.customer_name || lead.name || null,
      source: lead.first_touchpoint || lead.last_touchpoint || 'whatsapp',
      metadata: {
        ...lead.metadata,
        title: lead.booking_title || lead.metadata?.title || null,
      },
    }))

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}


