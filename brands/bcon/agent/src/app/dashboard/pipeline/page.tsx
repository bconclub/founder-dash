'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MdSearch, MdArrowDropDown, MdChevronLeft, MdChevronRight } from 'react-icons/md'

// --- Types ---

interface Lead {
  id: string
  name: string
  company?: string
  brand?: string
  lead_score: number | null
  first_touchpoint: string | null
  last_touchpoint: string | null
  last_interaction_at: string | null
  created_at?: string | null
  city: string | null
  lead_stage: string | null
  phone?: string
}

interface Stage {
  id: string
  dbValues: string[]
  label: string
  color: string
}

const STAGES: Stage[] = [
  { id: 'new', dbValues: ['New', ''], label: 'New', color: '#6b7280' },
  { id: 'engaged', dbValues: ['Engaged'], label: 'Engaged', color: '#3b82f6' },
  { id: 'qualified', dbValues: ['Qualified'], label: 'Qualified', color: '#6366f1' },
  { id: 'booking_made', dbValues: ['Booking Made'], label: 'Booking Made', color: '#8b5cf6' },
  { id: 'call_done', dbValues: ['High Intent'], label: 'Call Done', color: '#a78bfa' },
  { id: 'proposal_sent', dbValues: ['Proposal Sent'], label: 'Proposal Sent', color: '#f59e0b' },
  { id: 'closed_won', dbValues: ['Converted'], label: 'Closed Won', color: '#22c55e' },
  { id: 'closed_lost', dbValues: ['Cold', 'Closed Lost'], label: 'Closed Lost', color: '#ef4444' },
]

function mapLeadToStageId(lead: Lead): string {
  const s = lead.lead_stage || ''
  for (const stage of STAGES) {
    if (stage.dbValues.includes(s)) return stage.id
  }
  return 'new'
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function scoreColor(score: number | null): { bg: string; text: string } {
  if (score === null || score === undefined) return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' }
  if (score >= 60) return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' }
  if (score >= 30) return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' }
  return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' }
}

function ChannelIcon({ lead }: { lead: Lead }) {
  const ch = lead.last_touchpoint || lead.first_touchpoint
  if (ch === 'whatsapp') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.293-.175-2.828.84.84-2.828-.175-.293A8 8 0 1112 20z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b7280">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  )
}

// --- Main Page ---

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'activity' | 'days'>('score')
  const [page, setPage] = useState(1)
  const perPage = 20

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/leads?limit=1000')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // --- Computed data ---

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STAGES.forEach((s) => (counts[s.id] = 0))
    leads.forEach((l) => { counts[mapLeadToStageId(l)]++ })
    return counts
  }, [leads])

  const maxCount = useMemo(() => Math.max(1, ...Object.values(stageCounts)), [stageCounts])

  // Conversion % from previous stage
  const conversionPcts = useMemo(() => {
    const pcts: Record<string, number | null> = {}
    STAGES.forEach((s, i) => {
      if (i === 0) { pcts[s.id] = null; return }
      const prev = stageCounts[STAGES[i - 1].id]
      pcts[s.id] = prev > 0 ? Math.round((stageCounts[s.id] / prev) * 100) : 0
    })
    return pcts
  }, [stageCounts])

  // Insight cards
  const insights = useMemo(() => {
    const totalActive = leads.filter((l) => {
      const sid = mapLeadToStageId(l)
      return sid !== 'closed_won' && sid !== 'closed_lost'
    }).length

    // Avg time to close
    const wonLeads = leads.filter((l) => mapLeadToStageId(l) === 'closed_won')
    const avgDays = wonLeads.length > 0
      ? Math.round(wonLeads.reduce((sum, l) => sum + daysBetween(l.created_at || null, l.last_interaction_at), 0) / wonLeads.length)
      : 0

    // Biggest drop-off
    let biggestDrop = { from: '', to: '', pct: 0 }
    for (let i = 1; i < STAGES.length - 1; i++) {
      const prev = stageCounts[STAGES[i - 1].id]
      const curr = stageCounts[STAGES[i].id]
      if (prev > 0) {
        const drop = Math.round(((prev - curr) / prev) * 100)
        if (drop > biggestDrop.pct) {
          biggestDrop = { from: STAGES[i - 1].label, to: STAGES[i].label, pct: drop }
        }
      }
    }

    // Win rate
    const won = stageCounts['closed_won'] || 0
    const lost = stageCounts['closed_lost'] || 0
    const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0

    return { totalActive, avgDays, biggestDrop, winRate }
  }, [leads, stageCounts])

  // Filtered + sorted leads for table
  const tableLeads = useMemo(() => {
    let filtered = leads.filter((l) => {
      if (activeStage && mapLeadToStageId(l) !== activeStage) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(l.name || '').toLowerCase().includes(q) && !(l.phone || '').includes(q) && !(l.company || l.brand || '').toLowerCase().includes(q)) return false
      }
      return true
    })
    filtered.sort((a, b) => {
      if (sortBy === 'score') return (b.lead_score || 0) - (a.lead_score || 0)
      if (sortBy === 'activity') return new Date(b.last_interaction_at || 0).getTime() - new Date(a.last_interaction_at || 0).getTime()
      // days in stage — approximate by days since created
      return daysBetween(b.created_at || null, b.last_interaction_at) - daysBetween(a.created_at || null, a.last_interaction_at)
    })
    return filtered
  }, [leads, activeStage, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(tableLeads.length / perPage))
  const pagedLeads = tableLeads.slice((page - 1) * perPage, page * perPage)

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [activeStage, search, sortBy])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading pipeline…</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>Pipeline</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{leads.length} total leads</span>
      </div>

      {/* ── SECTION 1: Funnel ── */}
      <div>
        <div className="funnel-row" style={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
          {STAGES.map((stage, i) => {
            const count = stageCounts[stage.id]
            const conv = conversionPcts[stage.id]
            const isActive = activeStage === stage.id
            const isFirst = i === 0
            const isLast = i === STAGES.length - 1

            // Trapezoid heights shrink across the funnel
            const heightPct = 100 - (i * 6)
            const topInset = (100 - heightPct) / 2

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(isActive ? null : stage.id)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: 'relative',
                  background: isActive ? stage.color : `${stage.color}18`,
                  border: 'none',
                  cursor: 'pointer',
                  padding: '14px 6px',
                  clipPath: `polygon(0 ${topInset}%, 100% ${isLast ? topInset : topInset + 3}%, 100% ${isLast ? 100 - topInset : 100 - topInset - 3}%, 0 ${100 - topInset}%)`,
                  borderRadius: isFirst ? '6px 0 0 6px' : isLast ? '0 6px 6px 0' : 0,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 0 2px ${stage.color}, 0 0 12px ${stage.color}40` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
                className="funnel-stage"
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#fff' : stage.color, lineHeight: 1.2, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', padding: '0 2px' }}>
                  {stage.label}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: isActive ? '#fff' : 'var(--text-primary)', lineHeight: 1 }}>
                  {count}
                </span>
                {conv !== null && (
                  <span style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                    {conv}% conv
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Volume bar */}
        <div style={{ display: 'flex', gap: 2, marginTop: 8, height: 4, borderRadius: 2, overflow: 'hidden' }}>
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              style={{
                flex: Math.max(stageCounts[stage.id], 0.5),
                background: stage.color,
                borderRadius: 1,
                opacity: activeStage && activeStage !== stage.id ? 0.2 : 0.7,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Conversion Insights ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <InsightCard label="Active Pipeline" value={String(insights.totalActive)} sub="leads in progress" color="var(--text-primary)" />
        <InsightCard label="Avg Time to Close" value={insights.avgDays > 0 ? `${insights.avgDays}d` : '—'} sub="days to win" color="#3b82f6" />
        <InsightCard
          label="Biggest Drop-off"
          value={insights.biggestDrop.pct > 0 ? `${insights.biggestDrop.pct}%` : '—'}
          sub={insights.biggestDrop.from ? `${insights.biggestDrop.from} → ${insights.biggestDrop.to}` : 'no data'}
          color="#f59e0b"
        />
        <InsightCard label="Win Rate" value={`${insights.winRate}%`} sub="won vs lost" color="#22c55e" />
      </div>

      {/* ── SECTION 3: Lead List ── */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Table toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
            <MdSearch size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['score', 'activity', 'days'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)',
                  background: sortBy === s ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: sortBy === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {s === 'score' ? 'Score' : s === 'activity' ? 'Activity' : 'Days'}
              </button>
            ))}
          </div>
          {activeStage && (
            <button
              onClick={() => setActiveStage(null)}
              style={{ padding: '5px 10px', borderRadius: 5, background: `${STAGES.find((s) => s.id === activeStage)?.color}20`, color: STAGES.find((s) => s.id === activeStage)?.color, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {STAGES.find((s) => s.id === activeStage)?.label} ✕
            </button>
          )}
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 'auto' }}>
            {tableLeads.length} result{tableLeads.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.7fr 0.5fr 1fr 0.8fr 1fr', gap: 0, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Name</span>
          <span>Company</span>
          <span>Stage</span>
          <span>Score</span>
          <span>Ch</span>
          <span>Last Activity</span>
          <span>Days</span>
          <span>City</span>
        </div>

        {/* Table rows */}
        {pagedLeads.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            No leads found
          </div>
        ) : (
          pagedLeads.map((lead) => {
            const stageObj = STAGES.find((s) => s.id === mapLeadToStageId(lead))
            const sc = scoreColor(lead.lead_score)
            const days = daysBetween(lead.created_at || null, lead.last_interaction_at || new Date().toISOString())
            return (
              <div
                key={lead.id}
                className="pipeline-row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.7fr 0.5fr 1fr 0.8fr 1fr', gap: 0, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.name || 'Unknown'}
                  </div>
                  {lead.phone && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 1 }}>{lead.phone}</div>
                  )}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.company || lead.brand || '—'}
                </span>
                <span>
                  <span style={{ background: `${stageObj?.color}20`, color: stageObj?.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {stageObj?.label}
                  </span>
                </span>
                <span>
                  {lead.lead_score !== null && lead.lead_score !== undefined ? (
                    <span style={{ background: sc.bg, color: sc.text, padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {lead.lead_score}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>—</span>
                  )}
                </span>
                <span><ChannelIcon lead={lead} /></span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{relativeTime(lead.last_interaction_at)}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{days > 0 ? `${days}d` : '<1d'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.city || '—'}</span>
              </div>
            )
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? 'rgba(255,255,255,0.15)' : 'var(--text-secondary)', padding: 4 }}
            >
              <MdChevronLeft size={20} />
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? 'rgba(255,255,255,0.15)' : 'var(--text-secondary)', padding: 4 }}
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .funnel-stage:hover {
          filter: brightness(1.15);
        }
        .pipeline-row:hover {
          background: rgba(255,255,255,0.03);
        }
        @media (max-width: 900px) {
          .funnel-row {
            flex-wrap: wrap;
          }
          .funnel-row > button {
            clip-path: none !important;
            border-radius: 6px !important;
            min-width: calc(25% - 3px);
          }
        }
      `}</style>
    </div>
  )
}

// --- Insight Card ---

function InsightCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  )
}
