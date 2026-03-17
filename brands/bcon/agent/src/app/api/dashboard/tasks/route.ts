import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // If explicit status filter, only run that query
    if (status) {
      let query = supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', status)
        .order('scheduled_at', { ascending: false })

      if (type) query = query.eq('task_type', type)
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)

      const { data, error } = await query.limit(200)
      if (error) throw error
      return NextResponse.json({ tasks: data || [] })
    }

    // Query 1: pending and in_queue tasks (no date filter)
    let pendingQuery = supabase
      .from('agent_tasks')
      .select('*')
      .in('status', ['pending', 'in_queue'])
      .order('scheduled_at', { ascending: true })

    if (type) pendingQuery = pendingQuery.eq('task_type', type)

    // Query 2: completed/failed tasks with date filter
    let historyQuery = supabase
      .from('agent_tasks')
      .select('*')
      .in('status', ['completed', 'failed', 'failed_24h_window'])
      .gte('created_at', from || yesterday.toISOString())
      .order('completed_at', { ascending: false })

    if (to) historyQuery = historyQuery.lte('created_at', to)
    if (type) historyQuery = historyQuery.eq('task_type', type)

    const [pendingResult, historyResult] = await Promise.all([
      pendingQuery.limit(100),
      historyQuery.limit(200),
    ])

    if (pendingResult.error) throw pendingResult.error
    if (historyResult.error) throw historyResult.error

    const tasks = [...(pendingResult.data || []), ...(historyResult.data || [])]

    // Stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    const completedToday = (historyResult.data || []).filter(
      (t) => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= todayStart
    ).length
    const failedToday = (historyResult.data || []).filter(
      (t) => (t.status === 'failed' || t.status === 'failed_24h_window') && t.completed_at && new Date(t.completed_at) >= todayStart
    ).length
    const pendingCount = (pendingResult.data || []).filter((t) => t.status === 'pending').length
    // "In Queue" = tasks with scheduled_at in the next 1 hour
    const queuedCount = (pendingResult.data || []).filter(
      (t) => t.status === 'pending' && t.scheduled_at && new Date(t.scheduled_at) <= oneHourFromNow
    ).length
    const successRate = completedToday + failedToday > 0
      ? Math.round((completedToday / (completedToday + failedToday)) * 100)
      : 100

    return NextResponse.json({
      tasks,
      stats: {
        completedToday,
        failedToday,
        pendingCount,
        queuedCount,
        successRate,
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    )
  }
}
