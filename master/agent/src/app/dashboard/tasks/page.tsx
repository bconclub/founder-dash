'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MdNotifications,
  MdMessage,
  MdBarChart,
  MdDescription,
  MdCheckCircle,
  MdSchedule,
} from 'react-icons/md'

// --- Types ---

interface AgentTask {
  id: string
  brand: string
  lead_id: string | null
  lead_name: string | null
  lead_phone: string | null
  task_type: string
  task_description: string
  status: string
  scheduled_at: string | null
  completed_at: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface Stats {
  completedToday: number
  failedToday: number
  pendingCount: number
  queuedCount: number
  successRate: number
  reEngagedCount: number
}


// --- Helpers ---

function taskTypeIcon(type: string) {
  if (type.includes('reminder')) return <MdNotifications size={16} />
  if (type.includes('follow')) return <MdMessage size={16} />
  if (type.includes('scor')) return <MdBarChart size={16} />
  return <MdDescription size={16} />
}

function statusPill(status: string) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Completed' },
    failed: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Failed' },
    failed_24h_window: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Failed (24h)' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Pending' },
    in_queue: { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', label: 'Queued' },
  }
  const s = styles[status] || styles.pending
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
      {s.label}
    </span>
  )
}

function typeBadge(type: string) {
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
      {label}
    </span>
  )
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function firesIn(scheduledAt: string | null): string {
  if (!scheduledAt) return ''
  const diff = new Date(scheduledAt).getTime() - Date.now()
  if (diff <= 0) return 'Overdue'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Fires in ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Fires in ${hrs}h ${mins % 60}m`
  return `Fires at ${formatTime(scheduledAt)}`
}

function isWithin24Hours(scheduledAt: string | null): boolean {
  if (!scheduledAt) return false
  const diff = new Date(scheduledAt).getTime() - Date.now()
  return diff > 0 && diff <= 24 * 60 * 60 * 1000
}


// --- Stat Card ---

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 140,
        background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// --- Main Page ---

export default function TasksPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [stats, setStats] = useState<Stats>({ completedToday: 0, failedToday: 0, pendingCount: 0, queuedCount: 0, successRate: 100, reEngagedCount: 0 })
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
      if (data.stats) setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchTasks])

  // Column 1: Completed / Failed / Failed 24h window
  const completedTasks = tasks
    .filter((t) => t.status === 'completed' || t.status === 'failed' || t.status === 'failed_24h_window')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())

  // Column 2: Next 24 hours (pending within 24h) + queued (in_queue regardless of time)
  const next24hTasks = tasks
    .filter((t) => (t.status === 'pending' && isWithin24Hours(t.scheduled_at)) || t.status === 'in_queue')
    .sort((a, b) => new Date(a.scheduled_at || a.created_at).getTime() - new Date(b.scheduled_at || b.created_at).getTime())

  // Column 3: Upcoming (pending tasks beyond 24h)
  const upcomingTasks = tasks
    .filter((t) => t.status === 'pending' && !isWithin24Hours(t.scheduled_at))
    .sort((a, b) => new Date(a.scheduled_at || a.created_at).getTime() - new Date(b.scheduled_at || b.created_at).getTime())

  // Action handlers for next-24h column
  const handleSendNow = async (taskId: string) => {
    try {
      await fetch(`/api/dashboard/tasks/${taskId}/send-now`, { method: 'POST' })
      fetchTasks()
    } catch (err) {
      console.error('Send now failed:', err)
    }
  }

  const handleReschedule = async (taskId: string) => {
    try {
      await fetch(`/api/dashboard/tasks/${taskId}/reschedule`, { method: 'POST' })
      fetchTasks()
    } catch (err) {
      console.error('Reschedule failed:', err)
    }
  }

  const handleCancel = async (taskId: string) => {
    try {
      await fetch(`/api/dashboard/tasks/${taskId}/cancel`, { method: 'POST' })
      fetchTasks()
    } catch (err) {
      console.error('Cancel failed:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <style>{`@keyframes skpulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }`}</style>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20, color: 'white' }}>Tasks</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, height: 90, animation: 'skpulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}>
              <div style={{ height: 12, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 28, width: 50, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height: 32, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 16, animation: 'skpulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0, animation: 'skpulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8, animation: 'skpulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
              <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, animation: 'skpulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Header */}
      <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>Tasks</h1>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="Completed Today" value={stats.completedToday} color="#22c55e" />
        <StatCard label="Pending" value={stats.pendingCount} color="#f59e0b" />
        <StatCard label="In Queue" value={stats.queuedCount} color="#9ca3af" />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} color="var(--text-primary)" />
        <StatCard label="Re-engaged" value={stats.reEngagedCount} color="#8b5cf6" />
      </div>

      {/* 3-Column Layout */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Column 1 — Completed */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Completed
          </div>
          <div
            style={{
              background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              flex: 1,
              overflow: 'auto',
            }}
          >
            {completedTasks.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                No completed tasks
              </div>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', fontSize: 11, minWidth: 60, paddingTop: 2, flexShrink: 0 }}>
                    <div>{formatTime(task.completed_at || task.created_at)}</div>
                    <div style={{ opacity: 0.6 }}>{formatDate(task.completed_at || task.created_at)}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', paddingTop: 1, flexShrink: 0 }}>
                    {taskTypeIcon(task.task_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: '18px' }}>
                      {task.task_description}
                    </div>
                    {task.lead_name && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                        {task.lead_name} {task.lead_phone ? `(${task.lead_phone})` : ''}
                      </span>
                    )}
                    {(task.status === 'failed' || task.status === 'failed_24h_window') && task.error_message && (
                      <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>
                        {task.error_message}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>{statusPill(task.status)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2 — Next 24 Hours */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Next 24 Hours
          </div>
          <div
            style={{
              background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              flex: 1,
              overflow: 'auto',
            }}
          >
            {next24hTasks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 8 }}>
                <MdCheckCircle size={28} style={{ color: 'rgba(34,197,94,0.4)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No tasks in the next 24 hours</span>
              </div>
            ) : (
              next24hTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.task_description}
                    </span>
                    {typeBadge(task.task_type)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                      {task.lead_name || 'Unknown lead'}
                    </span>
                    <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 500 }}>
                      {firesIn(task.scheduled_at)}
                    </span>
                  </div>
                  {/* Context lines */}
                  {task.metadata?.context && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11, opacity: 0.7 }}>
                      {String(task.metadata.context)}
                    </div>
                  )}
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <button
                      onClick={() => handleSendNow(task.id)}
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 4,
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22c55e',
                        cursor: 'pointer',
                      }}
                    >
                      Send Now
                    </button>
                    <button
                      onClick={() => handleReschedule(task.id)}
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 4,
                        border: '1px solid rgba(245,158,11,0.3)',
                        background: 'rgba(245,158,11,0.1)',
                        color: '#f59e0b',
                        cursor: 'pointer',
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(task.id)}
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 4,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3 — Upcoming */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Upcoming
          </div>
          <div
            style={{
              background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              flex: 1,
              overflow: 'auto',
            }}
          >
            {upcomingTasks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 8 }}>
                <MdSchedule size={28} style={{ color: 'rgba(245,158,11,0.4)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No upcoming tasks</span>
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.task_description}
                    </span>
                    {typeBadge(task.task_type)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                      {task.lead_name || 'Unknown lead'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                      {formatDate(task.scheduled_at)} {formatTime(task.scheduled_at)}
                    </span>
                  </div>
                  {task.metadata?.context && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11, opacity: 0.7 }}>
                      {String(task.metadata.context)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
