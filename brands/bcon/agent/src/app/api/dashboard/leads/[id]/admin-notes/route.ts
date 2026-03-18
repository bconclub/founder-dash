import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Parse a time reference from note text and return a scheduled_at Date in IST.
 * Returns null if no actionable time reference found.
 */
function parseCallbackTime(noteText: string): Date | null {
  const lower = noteText.toLowerCase()
  const now = new Date()
  // IST offset: UTC+5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const nowIST = new Date(now.getTime() + istOffsetMs)

  // "call back at 5" / "call at 3" → today at that hour PM IST
  const atTimeMatch = lower.match(/(?:call\s*(?:back)?|follow\s*up)\s*(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (atTimeMatch) {
    let hour = parseInt(atTimeMatch[1])
    const minutes = atTimeMatch[2] ? parseInt(atTimeMatch[2]) : 0
    const ampm = atTimeMatch[3]?.toLowerCase()
    if (ampm === 'am' && hour === 12) hour = 0
    else if (ampm === 'pm' && hour !== 12) hour += 12
    else if (!ampm && hour >= 1 && hour <= 8) hour += 12 // assume PM for business hours

    const scheduled = new Date(nowIST)
    scheduled.setUTCHours(hour, minutes, 0, 0)
    // Convert from IST back to UTC
    return new Date(scheduled.getTime() - istOffsetMs)
  }

  // "call tomorrow" / "follow up tomorrow" → tomorrow 10 AM IST
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(nowIST)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(10, 0, 0, 0)
    return new Date(tomorrow.getTime() - istOffsetMs)
  }

  // "follow up in X days" / "call in X days" → X days from now at 10 AM IST
  const inDaysMatch = lower.match(/(?:follow\s*up|call\s*(?:back)?)\s*in\s+(\d+)\s*days?/)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    const future = new Date(nowIST)
    future.setUTCDate(future.getUTCDate() + days)
    future.setUTCHours(10, 0, 0, 0)
    return new Date(future.getTime() - istOffsetMs)
  }

  // Generic match with no specific time → tomorrow 10 AM IST
  const tomorrow = new Date(nowIST)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(10, 0, 0, 0)
  return new Date(tomorrow.getTime() - istOffsetMs)
}

/**
 * Check if note text contains callback/follow-up intent keywords.
 */
function hasCallbackIntent(noteText: string): boolean {
  const lower = noteText.toLowerCase()
  return /call\s*back|call\s*at\s+\d|call\s*tomorrow|follow\s*up/.test(lower)
}

/**
 * POST /api/dashboard/leads/[id]/admin-notes
 * Add an admin note to a lead — dual-writes to unified_context.admin_notes[] and activities table.
 * Parses note text for actionable intent (callbacks, stage changes) via keyword matching.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get the logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const createdBy = user?.email || 'system'

    const leadId = params.id
    const body = await request.json()
    const { note } = body

    if (!note?.trim()) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const trimmedNote = note.trim()
    const lowerNote = trimmedNote.toLowerCase()

    // 1. Fetch current lead data (unified_context + lead info for task creation)
    const { data: lead, error: leadError } = await supabase
      .from('all_leads')
      .select('unified_context, customer_name, customer_phone_normalized, phone')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 2. Append to unified_context.admin_notes[]
    const existingCtx = lead.unified_context || {}
    const existingNotes = existingCtx.admin_notes || []
    const newNote = {
      text: trimmedNote,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    }

    const updatedCtx = {
      ...existingCtx,
      admin_notes: [...existingNotes, newNote],
    }

    // 3. Update all_leads with new note
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
        note: trimmedNote,
        created_by: createdBy,
      })

    // 5. Parse note for actionable intent (keyword matching, no AI calls)
    const actions: string[] = []
    const leadPhone = lead.customer_phone_normalized || lead.phone?.replace(/\D/g, '').slice(-10) || null
    const leadName = lead.customer_name || 'Lead'

    // 5a. Callback / follow-up intent → create agent_tasks
    if (hasCallbackIntent(lowerNote)) {
      const scheduledAt = parseCallbackTime(trimmedNote)
      if (scheduledAt) {
        const { error: taskError } = await supabase
          .from('agent_tasks')
          .insert({
            task_type: 'human_callback',
            task_description: trimmedNote,
            lead_id: leadId,
            lead_phone: leadPhone,
            lead_name: leadName,
            status: 'pending',
            scheduled_at: scheduledAt.toISOString(),
            metadata: { source: 'admin_note' },
            created_at: new Date().toISOString(),
          })
        if (taskError) {
          console.error('[AdminNote] Failed to create callback task:', taskError.message)
        } else {
          actions.push(`callback_task_created:${scheduledAt.toISOString()}`)
        }
      }
    }

    // 5b. "not interested" / "lost" / "dead lead" → Closed Lost
    if (/not\s*interested|lost|dead\s*lead/.test(lowerNote)) {
      await supabase
        .from('all_leads')
        .update({ lead_stage: 'Closed Lost', stage_override: true })
        .eq('id', leadId)
      actions.push('stage_updated:Closed Lost')
    }

    // 5c. "converted" / "signed" / "closed won" / "deal done" → Converted
    if (/converted|signed|closed\s*won|deal\s*done/.test(lowerNote)) {
      await supabase
        .from('all_leads')
        .update({ lead_stage: 'Converted', stage_override: true })
        .eq('id', leadId)
      actions.push('stage_updated:Converted')
    }

    // 6. If any action was taken, invalidate cached unified_summary
    if (actions.length > 0) {
      const { data: freshLead } = await supabase
        .from('all_leads')
        .select('unified_context')
        .eq('id', leadId)
        .single()

      if (freshLead) {
        const ctx = freshLead.unified_context || {}
        const { error: summaryErr } = await supabase
          .from('all_leads')
          .update({ unified_context: { ...ctx, unified_summary: null } })
          .eq('id', leadId)
        if (summaryErr) {
          console.error('[AdminNote] Failed to invalidate summary:', summaryErr.message)
        }
      }
    }

    return NextResponse.json({ success: true, note: newNote, actions })
  } catch (error) {
    console.error('Error saving admin note:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
