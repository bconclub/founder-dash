import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch leads from unified_leads view (includes chat_sessions and dashboard_leads)
    const { data: leads, error } = await supabase
      .from('unified_leads')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) throw error

    // Map to dashboard format
    const mappedLeads = leads?.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source || 'web',
      timestamp: lead.timestamp,
      status: lead.status,
      booking_date: lead.booking_date,
      booking_time: lead.booking_time,
      metadata: lead.metadata,
    }))

    return NextResponse.json({ leads: mappedLeads || [] })
  } catch (error) {
    console.error('Error fetching web agent leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Store lead in dashboard_leads table
    const { data, error } = await supabase
      .from('dashboard_leads')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: 'web',
        status: 'new',
        chat_session_id: body.chat_session_id || null,
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Error creating web agent lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}


