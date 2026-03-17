import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are PROXe, the AI assistant for this business dashboard. You have access to real-time lead, booking, task, and conversation data. Answer the owner's questions accurately and concisely using the data provided. If asked about a specific lead, search by name or phone in the data. Give numbers, names, and specifics — never vague answers. Keep responses conversational but data-driven. Use short paragraphs. If the data doesn't contain what's needed, say so honestly.`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
    }

    const supabase = await createClient()

    // Gather all context data in parallel
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const [
      leadsResult,
      recentLeadsResult,
      tasksResult,
      conversationsResult,
      stageBreakdownResult,
    ] = await Promise.all([
      // Total leads count
      supabase.from('all_leads').select('id', { count: 'exact', head: true }).eq('brand', 'bcon'),
      // Last 15 leads with details
      supabase.from('all_leads')
        .select('customer_name, customer_phone_normalized, lead_stage, lead_score, first_touchpoint, last_touchpoint, last_interaction_at, created_at, unified_context')
        .eq('brand', 'bcon')
        .order('last_interaction_at', { ascending: false })
        .limit(15),
      // Pending + recent tasks
      supabase.from('agent_tasks')
        .select('task_type, task_description, lead_name, lead_phone, status, scheduled_at, completed_at, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
      // Recent conversations across all channels
      supabase.from('conversations')
        .select('lead_id, sender, content, channel, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
      // Lead stage breakdown
      supabase.from('all_leads')
        .select('lead_stage')
        .eq('brand', 'bcon'),
    ])

    // Calculate stage breakdown
    const stageCounts: Record<string, number> = {}
    if (stageBreakdownResult.data) {
      for (const lead of stageBreakdownResult.data) {
        const stage = lead.lead_stage || 'Unknown'
        stageCounts[stage] = (stageCounts[stage] || 0) + 1
      }
    }

    // Calculate metrics
    const totalLeads = leadsResult.count || 0
    const leadsThisWeek = recentLeadsResult.data?.filter(
      l => new Date(l.created_at) >= new Date(weekAgo)
    ).length || 0

    const pendingTasks = tasksResult.data?.filter(t => t.status === 'pending') || []
    const completedToday = tasksResult.data?.filter(
      t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= todayStart
    ) || []
    const failedToday = tasksResult.data?.filter(
      t => (t.status === 'failed' || t.status === 'failed_24h_window') && t.completed_at && new Date(t.completed_at) >= todayStart
    ) || []

    // Get upcoming bookings from tasks
    const upcomingBookings = tasksResult.data?.filter(
      t => (t.task_type.includes('reminder') || t.task_type.includes('booking')) && t.status === 'pending'
    ) || []

    // Build context block
    const context = `
=== REAL-TIME DASHBOARD DATA (${now.toISOString()}) ===

LEAD OVERVIEW:
- Total leads: ${totalLeads}
- New leads this week: ${leadsThisWeek}
- Stage breakdown: ${Object.entries(stageCounts).map(([s, c]) => `${s}: ${c}`).join(', ')}

RECENT LEADS (last 15):
${recentLeadsResult.data?.map(l => `- ${l.customer_name || 'Unknown'} | Phone: ${l.customer_phone_normalized || 'N/A'} | Stage: ${l.lead_stage || 'N/A'} | Score: ${l.lead_score ?? 'N/A'} | Source: ${l.first_touchpoint || 'N/A'} | Last active: ${l.last_interaction_at || 'N/A'}`).join('\n') || 'No leads found'}

TASKS:
- Pending tasks: ${pendingTasks.length}
- Completed today: ${completedToday.length}
- Failed today: ${failedToday.length}
${pendingTasks.length > 0 ? `Pending:\n${pendingTasks.map(t => `- ${t.task_type}: ${t.lead_name || 'Unknown'} — scheduled ${t.scheduled_at || 'N/A'}`).join('\n')}` : ''}

UPCOMING BOOKINGS/REMINDERS:
${upcomingBookings.length > 0 ? upcomingBookings.map(b => `- ${b.task_type}: ${b.lead_name || 'Unknown'} at ${b.scheduled_at || 'N/A'}`).join('\n') : 'No upcoming bookings'}

RECENT CONVERSATIONS (last 15 messages):
${conversationsResult.data?.map(m => `- [${m.channel}] ${m.sender}: ${(m.content || '').substring(0, 120)} (${m.created_at})`).join('\n') || 'No recent conversations'}
`

    // Build messages array with conversation history
    const messages: Array<{ role: string; content: string }> = []

    // Add previous conversation history (last 10 turns)
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    // Add current message with context
    messages.push({
      role: 'user',
      content: `${context}\n\nUser question: ${message}`,
    })

    // Stream from Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    })

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text()
      console.error('Claude API error:', claudeRes.status, errBody)
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), { status: 502 })
    }

    // Stream SSE response to client
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = claudeRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const event = JSON.parse(data)
                if (event.type === 'content_block_delta' && event.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
                }
                if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500 }
    )
  }
}
