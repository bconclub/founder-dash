import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper function to normalize phone number (same logic as in chatSessions.ts)
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const digits = phone.replace(/\D/g, '');
  
  if (!digits || digits.length < 10) return null;
  
  // Remove India country code (+91)
  let cleaned = digits;
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  // Remove US/Canada country code (+1)
  else if (cleaned.startsWith('1') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  if (cleaned.length < 10) return null;
  
  return cleaned.slice(-10);
}

/**
 * POST /api/admin/backfill-leads
 * Admin endpoint to trigger backfill of web_sessions to all_leads
 * This links existing sessions with phone/email to leads
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Optional: Add auth check here if needed
    // For now, allowing unauthenticated access (can be restricted later)
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json().catch(() => ({}))
    const limit = parseInt(body.limit || '100', 10)
    const brand = body.brand || 'proxe'

    console.log('[Admin Backfill] Starting backfill', { limit, brand })

    // Fetch sessions with phone/email but no lead_id
    const { data: sessions, error: fetchError } = await supabase
      .from('web_sessions')
      .select('id, external_session_id, customer_name, customer_email, customer_phone, brand, conversation_summary, booking_status, booking_date, booking_time, user_inputs_summary, created_at, updated_at')
      .is('lead_id', null)
      .or('customer_phone.not.is.null,customer_email.not.is.null')
      .limit(limit)

    if (fetchError) {
      console.error('[Admin Backfill] Failed to fetch sessions', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch sessions',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
        },
        { status: 500 }
      )
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions to backfill',
        result: {
          processed: 0,
          leadsCreated: 0,
          leadsUpdated: 0,
          sessionsLinked: 0,
          errors: 0
        }
      })
    }

    let processed = 0
    let leadsCreated = 0
    let leadsUpdated = 0
    let sessionsLinked = 0
    let errors = 0

    // Process each session
    for (const session of sessions) {
      try {
        processed++
        
        const normalizedPhone = normalizePhone(session.customer_phone)
        
        // Need at least phone or email
        if (!normalizedPhone && !session.customer_email) {
          console.warn('[Admin Backfill] Skipping session - no valid phone or email', {
            sessionId: session.id,
            externalSessionId: session.external_session_id
          })
          errors++
          continue
        }

        // Check for existing lead
        let existingLead: any = null
        
        if (normalizedPhone) {
          const { data } = await supabase
            .from('all_leads')
            .select('id, created_at')
            .eq('customer_phone_normalized', normalizedPhone)
            .eq('brand', session.brand || brand)
            .maybeSingle()
          existingLead = data
        }

        if (!existingLead && session.customer_email) {
          const { data } = await supabase
            .from('all_leads')
            .select('id, created_at')
            .eq('email', session.customer_email)
            .eq('brand', session.brand || brand)
            .maybeSingle()
          existingLead = data
        }

        let leadId: string | null = null

        if (existingLead) {
          // Update existing lead
          const { error: updateError } = await supabase
            .from('all_leads')
            .update({
              customer_name: session.customer_name || undefined,
              email: session.customer_email || undefined,
              phone: session.customer_phone || undefined,
              customer_phone_normalized: normalizedPhone || undefined,
              last_touchpoint: 'web',
              last_interaction_at: session.updated_at || session.created_at
            })
            .eq('id', existingLead.id)

          if (updateError) {
            console.error('[Admin Backfill] Failed to update lead', {
              error: updateError,
              leadId: existingLead.id
            })
            errors++
            continue
          }

          leadId = existingLead.id
          leadsUpdated++
        } else {
          // Create new lead
          const insertData: any = {
            customer_name: session.customer_name,
            email: session.customer_email,
            phone: session.customer_phone,
            first_touchpoint: 'web',
            last_touchpoint: 'web',
            last_interaction_at: session.updated_at || session.created_at,
            brand: session.brand || brand
          }

          if (normalizedPhone) {
            insertData.customer_phone_normalized = normalizedPhone
          }

          const { data: created, error: createError } = await supabase
            .from('all_leads')
            .insert(insertData)
            .select('id')
            .single()

          if (createError) {
            // Handle duplicate (race condition)
            if (createError.code === '23505') {
              // Try to fetch existing
              if (normalizedPhone) {
                const { data } = await supabase
                  .from('all_leads')
                  .select('id')
                  .eq('customer_phone_normalized', normalizedPhone)
                  .eq('brand', session.brand || brand)
                  .maybeSingle()
                if (data) leadId = data.id
              }
            }
            
            if (!leadId) {
              console.error('[Admin Backfill] Failed to create lead', {
                error: createError,
                sessionId: session.id
              })
              errors++
              continue
            }
          } else {
            leadId = created?.id || null
            if (leadId) {
              leadsCreated++
            }
          }
        }

        // Link session to lead
        if (leadId) {
          const { error: linkError } = await supabase
            .from('web_sessions')
            .update({ lead_id: leadId })
            .eq('id', session.id)

          if (linkError) {
            console.error('[Admin Backfill] Failed to link session', {
              error: linkError,
              sessionId: session.id,
              leadId
            })
            errors++
          } else {
            sessionsLinked++
          }
        }
      } catch (err: any) {
        console.error('[Admin Backfill] Error processing session', {
          error: err,
          sessionId: session.id
        })
        errors++
      }
    }

    console.log('[Admin Backfill] Backfill complete', {
      processed,
      leadsCreated,
      leadsUpdated,
      sessionsLinked,
      errors
    })

    return NextResponse.json({
      success: true,
      message: 'Backfill completed',
      result: {
        processed,
        leadsCreated,
        leadsUpdated,
        sessionsLinked,
        errors
      }
    })
  } catch (error) {
    console.error('[Admin Backfill] Error during backfill', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run backfill',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/backfill-leads
 * Get status of backfill (how many sessions need linking)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Optional: Add auth check here if needed
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Count sessions with phone/email but no lead_id
    const { count, error } = await supabase
      .from('web_sessions')
      .select('*', { count: 'exact', head: true })
      .is('lead_id', null)
      .or('customer_phone.not.is.null,customer_email.not.is.null')

    if (error) {
      console.error('[Admin Backfill] Error counting sessions', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to count sessions',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // Count total leads
    const { count: totalLeads, error: leadsError } = await supabase
      .from('all_leads')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      status: {
        unlinkedSessions: count || 0,
        totalLeads: totalLeads || 0,
        needsBackfill: (count || 0) > 0
      }
    })
  } catch (error) {
    console.error('[Admin Backfill] Error getting status', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get backfill status',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
