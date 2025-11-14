import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if needed
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.WHATSAPP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    // Store WhatsApp lead in dashboard_leads table
    const { data, error } = await supabase
      .from('dashboard_leads')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: 'whatsapp',
        status: 'new',
        metadata: {
          whatsapp_id: body.whatsapp_id,
          message: body.message,
          ...body.metadata,
        },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}


