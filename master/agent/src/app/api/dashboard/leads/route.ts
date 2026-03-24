import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/services/leadManager'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('unified_leads')
      .select('*', { count: 'exact' })
      .order('last_interaction_at', { ascending: false })

    if (source) {
      // Filter by first_touchpoint or last_touchpoint
      query = query.or(`first_touchpoint.eq.${source},last_touchpoint.eq.${source}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      // Use last_interaction_at for date filtering (more accurate than timestamp)
      query = query.gte('last_interaction_at', startDate)
    }

    if (endDate) {
      query = query.lte('last_interaction_at', endDate)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    return NextResponse.json({
      leads: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, phone, email, source, context_note, auto_sequence } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid phone number — must be at least 10 digits' }, { status: 400 })
    }

    const brand = process.env.NEXT_PUBLIC_BRAND || 'bcon'

    // Check for duplicate
    const { data: existing } = await supabase
      .from('all_leads')
      .select('id')
      .eq('customer_phone_normalized', normalized)
      .eq('brand', brand)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Lead with this phone already exists', existing_lead_id: existing.id },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const touchpoint = source || 'manual'

    // Create lead
    const { data: newLead, error: insertError } = await supabase
      .from('all_leads')
      .insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_phone_normalized: normalized,
        customer_email: email?.trim() || null,
        first_touchpoint: touchpoint,
        last_touchpoint: touchpoint,
        brand,
        status: 'New Lead',
        lead_stage: 'New',
        lead_score: 10,
        last_interaction_at: now,
        unified_context: context_note?.trim()
          ? { manual: { context_note: context_note.trim(), source: touchpoint, created_at: now } }
          : { manual: { source: touchpoint, created_at: now } },
      })
      .select('id')
      .single()

    if (insertError || !newLead) {
      console.error('[POST /leads] Insert error:', insertError?.message)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    // Log context note as first conversation entry
    if (context_note?.trim()) {
      await supabase.from('conversations').insert({
        lead_id: newLead.id,
        channel: touchpoint,
        sender: 'system',
        content: context_note.trim(),
        message_type: 'admin_note',
        metadata: { source: 'manual_create', touchpoint },
      }).then(({ error }) => {
        if (error) console.error('[POST /leads] Conversation log error:', error.message)
      })
    }

    // Create first_outreach task so the sequence starts automatically
    if (auto_sequence !== false) {
      await supabase.from('agent_tasks').insert({
        task_type: 'first_outreach',
        task_description: `Auto: first_outreach for ${name.trim()}`,
        lead_id: newLead.id,
        lead_phone: normalized,
        lead_name: name.trim(),
        scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        status: 'pending',
        metadata: { source: touchpoint, manual_create: true },
        created_at: now,
      }).then(({ error }) => {
        if (error) console.error('[POST /leads] Task create error:', error.message)
      })
    }

    return NextResponse.json({ id: newLead.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /leads] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
