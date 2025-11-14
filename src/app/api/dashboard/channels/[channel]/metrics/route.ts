import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channel = params.channel

    // Get leads for this specific channel
    const { data: leads, error: leadsError } = await supabase
      .from('unified_leads')
      .select('*')
      .eq('source', channel)

    if (leadsError) throw leadsError

    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Calculate channel-specific metrics
    const totalConversations = leads?.length || 0
    const activeConversations =
      leads?.filter((lead) => new Date(lead.timestamp) >= last24Hours).length ||
      0

    // Calculate conversion rate
    const bookedLeads =
      leads?.filter((lead) => lead.booking_date && lead.booking_time).length ||
      0
    const conversionRate =
      totalConversations > 0
        ? Math.round((bookedLeads / totalConversations) * 100)
        : 0

    // Average response time (mock data - replace with actual calculation)
    const avgResponseTime = 5 // minutes

    // Conversations over time (last 7 days)
    const conversationsOverTime = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count =
        leads?.filter((lead) => lead.timestamp.startsWith(dateStr)).length || 0
      conversationsOverTime.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      })
    }

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    leads?.forEach((lead) => {
      const status = lead.status || 'new'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }))

    return NextResponse.json({
      totalConversations,
      activeConversations,
      avgResponseTime,
      conversionRate,
      conversationsOverTime,
      statusBreakdown,
    })
  } catch (error) {
    console.error('Error fetching channel metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel metrics' },
      { status: 500 }
    )
  }
}


