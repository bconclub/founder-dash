import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/dashboard/leads/[id]/admin-notes
 * Add an admin note to a lead — dual-writes to unified_context.admin_notes[] and activities table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const leadId = params.id
    const body = await request.json()
    const { note } = body

    if (!note?.trim()) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    // 1. Fetch current unified_context
    const { data: lead, error: leadError } = await supabase
      .from('all_leads')
      .select('unified_context')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 2. Append to unified_context.admin_notes[]
    const existingCtx = lead.unified_context || {}
    const existingNotes = existingCtx.admin_notes || []
    const newNote = {
      text: note.trim(),
      created_by: 'system',
      created_at: new Date().toISOString(),
    }

    const updatedCtx = {
      ...existingCtx,
      admin_notes: [...existingNotes, newNote],
    }

    // 3. Update all_leads
    const { error: updateError } = await supabase
      .from('all_leads')
      .update({ unified_context: updatedCtx })
      .eq('id', leadId)

    if (updateError) throw updateError

    // 4. Also insert into activities table (appears in Activity tab)
    await supabase
      .from('activities')
      .insert({
        lead_id: leadId,
        activity_type: 'note',
        note: note.trim(),
        created_by: 'system',
      })

    return NextResponse.json({ success: true, note: newNote })
  } catch (error) {
    console.error('Error saving admin note:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
