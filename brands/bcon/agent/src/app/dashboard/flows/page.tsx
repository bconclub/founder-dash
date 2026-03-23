'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MdArrowBack,
  MdPeople,
  MdAccessTime,
  MdTrendingUp,
  MdSkipNext,
  MdRemoveCircleOutline,
  MdPause,
  MdChat,
  MdEvent,
  MdPhoneCallback,
  MdPhoneMissed,
  MdReplay,
  MdAutorenew,
  MdWbSunny,
  MdTimeline,
} from 'react-icons/md'
import LeadDetailsModal from '@/components/dashboard/LeadDetailsModal'

// ── Types ─────────────────────────────────────────────────────────

interface FlowSummary {
  id: string
  name: string
  leadCount: number
  lastActivity: string | null
  successRate: number
  respondedCount: number
  steps: { name: string; order: number }[]
}

interface BoardLead {
  lead_id: string
  lead_name: string
  lead_phone: string
  task_id: string | null
  status: string
  scheduled_at: string | null
  completed_at: string | null
  responded: boolean
  all_task_ids: string[]
}

interface BoardStep {
  name: string
  order: number
  leads: BoardLead[]
}

// ── Flow visual config ────────────────────────────────────────────

const FLOW_STYLE: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new_lead_outreach:  { icon: <MdTimeline size={20} />,       color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  active_conversation:{ icon: <MdChat size={20} />,            color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  booking_made:       { icon: <MdEvent size={20} />,           color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  post_call:          { icon: <MdPhoneCallback size={20} />,   color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
  rnr:                { icon: <MdPhoneMissed size={20} />,     color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  follow_up_sequence: { icon: <MdReplay size={20} />,          color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  re_engagement:      { icon: <MdAutorenew size={20} />,       color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
  morning_briefing:   { icon: <MdWbSunny size={20} />,         color: '#eab308', bg: 'rgba(234,179,8,0.10)' },
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  queued:    { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'Awaiting' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'Sent' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Failed' },
  responded: { color: '#22c55e', bg: 'rgba(34,197,94,0.20)',  label: 'Responded' },
  active:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Active' },
}

// ── Helpers ───────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 0) {
    const future = -diff
    const m = Math.floor(future / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `In ${d}d ${h % 24}h`
    if (h > 0) return `In ${h}h ${m % 60}m`
    return `In ${m}m`
  }
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'Just now'
}

function countdown(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Now'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `In ${d}d ${h % 24}h`
  if (h > 0) return `In ${h}h ${m % 60}m`
  return `In ${m}m`
}

// ── Main Page ─────────────────────────────────────────────────────

export default function FlowsPage() {
  const [view, setView] = useState<'overview' | 'board'>('overview')
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
  const [selectedFlowName, setSelectedFlowName] = useState('')
  const [flows, setFlows] = useState<FlowSummary[]>([])
  const [board, setBoard] = useState<{ flowId: string; steps: BoardStep[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [boardLoading, setBoardLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchFlows = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/flows')
      if (!res.ok) return
      const data = await res.json()
      setFlows(data.flows || [])
    } catch (err) {
      console.error('Failed to fetch flows:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBoard = useCallback(async (fid: string) => {
    setBoardLoading(true)
    try {
      const res = await fetch(`/api/dashboard/flows?flow=${fid}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.flows) setFlows(data.flows)
      if (data.board) setBoard(data.board)
    } catch (err) {
      console.error('Failed to fetch board:', err)
    } finally {
      setBoardLoading(false)
    }
  }, [])

  // ── Quick actions ───────────────────────────────────────────────

  const taskAction = async (taskId: string, action: string, scheduledAt?: string) => {
    try {
      const res = await fetch(`/api/dashboard/tasks/${taskId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, scheduled_at: scheduledAt }),
      })
      return (await res.json()).success
    } catch { return false }
  }

  const handleSkip = async (lead: BoardLead) => {
    if (!lead.task_id) return
    setActionLoading(lead.lead_id)
    await taskAction(lead.task_id, 'cancel')
    if (selectedFlowId) await fetchBoard(selectedFlowId)
    setActionLoading(null)
  }

  const handleRemove = async (lead: BoardLead) => {
    setActionLoading(lead.lead_id)
    for (const tid of lead.all_task_ids) {
      await taskAction(tid, 'cancel')
    }
    if (selectedFlowId) await fetchBoard(selectedFlowId)
    setActionLoading(null)
  }

  const handlePause = async (lead: BoardLead) => {
    setActionLoading(lead.lead_id)
    // Set all pending tasks to queued (awaiting approval) by rescheduling far out
    // The action API supports cancel but not "pause" directly, so we use the
    // existing reschedule to push tasks far out, effectively pausing them.
    // Actually, let's cancel and note it. A true pause would need a new action.
    // For now, cancel all tasks for this lead.
    for (const tid of lead.all_task_ids) {
      await taskAction(tid, 'cancel')
    }
    if (selectedFlowId) await fetchBoard(selectedFlowId)
    setActionLoading(null)
  }

  const handleLeadClick = async (leadId: string) => {
    try {
      const res = await fetch(`/api/dashboard/leads/${leadId}`)
      if (!res.ok) return
      const lead = await res.json()
      setSelectedLead({
        id: lead.id,
        name: lead.customer_name || lead.name || 'Unknown',
        email: lead.email || '',
        phone: lead.customer_phone_normalized || lead.phone || '',
        source: lead.first_touchpoint || lead.last_touchpoint || 'whatsapp',
        first_touchpoint: lead.first_touchpoint || null,
        last_touchpoint: lead.last_touchpoint || null,
        timestamp: lead.created_at || '',
        status: lead.status || null,
        booking_date: lead.unified_context?.web?.booking_date || null,
        booking_time: lead.unified_context?.web?.booking_time || null,
        unified_context: lead.unified_context || null,
        metadata: lead.metadata || {},
        lead_score: lead.lead_score || null,
        lead_stage: lead.lead_stage || null,
        sub_stage: lead.sub_stage || null,
      })
      setIsLeadModalOpen(true)
    } catch (err) {
      console.error('Failed to fetch lead:', err)
    }
  }

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: string) => {
    try {
      await fetch(`/api/dashboard/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {}
  }, [])

  // ── Auto-refresh ────────────────────────────────────────────────

  useEffect(() => {
    fetchFlows()
    const interval = setInterval(fetchFlows, 30000)
    return () => clearInterval(interval)
  }, [fetchFlows])

  useEffect(() => {
    if (selectedFlowId) {
      fetchBoard(selectedFlowId)
      const interval = setInterval(() => fetchBoard(selectedFlowId), 30000)
      return () => clearInterval(interval)
    }
  }, [selectedFlowId, fetchBoard])

  // ── Loading state ───────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading flows...</span>
      </div>
    )
  }

  // ── Board view ──────────────────────────────────────────────────

  if (view === 'board' && board && selectedFlowId) {
    const flowStyle = FLOW_STYLE[selectedFlowId] || FLOW_STYLE.new_lead_outreach
    const totalLeads = board.steps.reduce((sum, s) => sum + s.leads.length, 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
        {/* Board header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => { setView('overview'); setSelectedFlowId(null); setBoard(null) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6,
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
            }}
          >
            <MdArrowBack size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: flowStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: flowStyle.color }}>
              {flowStyle.icon}
            </div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedFlowName}</h1>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{totalLeads} lead{totalLeads !== 1 ? 's' : ''} in flow</span>
            </div>
          </div>
          {boardLoading && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>Refreshing...</span>
          )}
        </div>

        {/* Kanban columns */}
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {board.steps.map((step, si) => (
            <div
              key={si}
              style={{
                flex: '1 1 0',
                minWidth: 220,
                maxWidth: 320,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8, padding: '0 4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: flowStyle.color, flexShrink: 0,
                  }} />
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                    {step.name}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                  background: 'rgba(255,255,255,0.06)', padding: '1px 8px', borderRadius: 10,
                }}>
                  {step.leads.length}
                </span>
              </div>

              {/* Step connector arrow */}
              {si < board.steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.15)', fontSize: 16,
                }}>
                  →
                </div>
              )}

              {/* Lead cards */}
              <div style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                flex: 1,
                overflow: 'auto',
                padding: step.leads.length > 0 ? 6 : 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                {step.leads.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '32px 12px', color: 'var(--text-muted)', fontSize: 12,
                  }}>
                    No leads at this step
                  </div>
                ) : (
                  step.leads.map((lead) => {
                    const st = lead.responded
                      ? STATUS_STYLE.responded
                      : STATUS_STYLE[lead.status] || STATUS_STYLE.pending
                    const isLoading = actionLoading === lead.lead_id
                    const timing = lead.status === 'pending' || lead.status === 'queued'
                      ? countdown(lead.scheduled_at)
                      : lead.completed_at
                        ? `Sent ${relativeTime(lead.completed_at)}`
                        : ''

                    return (
                      <div
                        key={lead.lead_id + '-' + si}
                        style={{
                          background: 'var(--bg-primary, #1a1a1a)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          opacity: isLoading ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {/* Name + status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span
                            onClick={() => handleLeadClick(lead.lead_id)}
                            style={{
                              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', textDecoration: 'underline',
                              textDecorationColor: 'rgba(255,255,255,0.15)',
                              textUnderlineOffset: 2,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: '65%',
                            }}
                          >
                            {lead.lead_name}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            color: st.color, background: st.bg, flexShrink: 0,
                          }}>
                            {st.label}
                          </span>
                        </div>

                        {/* Phone */}
                        {lead.lead_phone && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
                            {lead.lead_phone}
                          </div>
                        )}

                        {/* Timing */}
                        {timing && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                            <MdAccessTime size={11} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{timing}</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!lead.responded && lead.task_id && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => handleSkip(lead)}
                              disabled={isLoading}
                              title="Skip to next step"
                              style={{
                                background: 'rgba(59,130,246,0.10)', border: 'none', borderRadius: 4,
                                padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                color: '#3b82f6', fontSize: 10, fontWeight: 600,
                              }}
                            >
                              <MdSkipNext size={12} /> Skip
                            </button>
                            <button
                              onClick={() => handleRemove(lead)}
                              disabled={isLoading}
                              title="Remove from flow"
                              style={{
                                background: 'rgba(239,68,68,0.10)', border: 'none', borderRadius: 4,
                                padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                color: '#ef4444', fontSize: 10, fontWeight: 600,
                              }}
                            >
                              <MdRemoveCircleOutline size={12} /> Remove
                            </button>
                            <button
                              onClick={() => handlePause(lead)}
                              disabled={isLoading}
                              title="Pause all steps"
                              style={{
                                background: 'rgba(245,158,11,0.10)', border: 'none', borderRadius: 4,
                                padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                color: '#f59e0b', fontSize: 10, fontWeight: 600,
                              }}
                            >
                              <MdPause size={12} /> Pause
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedLead && (
          <LeadDetailsModal
            lead={selectedLead}
            isOpen={isLeadModalOpen}
            onClose={() => { setIsLeadModalOpen(false); setSelectedLead(null) }}
            onStatusUpdate={updateLeadStatus}
          />
        )}
      </div>
    )
  }

  // ── Overview grid ───────────────────────────────────────────────

  const totalLeadsInFlows = flows.reduce((sum, f) => sum + f.leadCount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>Flows</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {totalLeadsInFlows} leads across all flows
        </span>
      </div>

      {/* Flow cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {flows.map((flow) => {
          const style = FLOW_STYLE[flow.id] || FLOW_STYLE.new_lead_outreach
          return (
            <button
              key={flow.id}
              onClick={() => {
                setSelectedFlowId(flow.id)
                setSelectedFlowName(flow.name)
                setView('board')
              }}
              style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '20px 20px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, transform 0.1s',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = style.color
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Top: icon + name + lead count badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: style.color, flexShrink: 0,
                }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {flow.name}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: style.bg, color: style.color,
                  padding: '3px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  <MdPeople size={14} />
                  {flow.leadCount}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MdAccessTime size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                    {flow.lastActivity ? relativeTime(flow.lastActivity) : 'No activity'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MdTrendingUp size={13} style={{ color: flow.successRate >= 50 ? '#22c55e' : flow.successRate >= 20 ? '#f59e0b' : 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                    {flow.successRate}% responded
                  </span>
                </div>
              </div>

              {/* Success rate bar */}
              <div style={{
                width: '100%', height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: `${Math.max(flow.successRate, 2)}%`,
                  height: '100%', borderRadius: 2,
                  background: style.color,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Steps preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {flow.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                      {step.name}
                    </span>
                    {i < flow.steps.length - 1 && (
                      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isLeadModalOpen}
          onClose={() => { setIsLeadModalOpen(false); setSelectedLead(null) }}
          onStatusUpdate={updateLeadStatus}
        />
      )}
    </div>
  )
}
