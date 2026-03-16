'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md'

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
  { id: 'new', dbValues: ['New', ''], label: 'New', color: '#64748b' },
  { id: 'engaged', dbValues: ['Engaged'], label: 'Engaged', color: '#6b7fa8' },
  { id: 'qualified', dbValues: ['Qualified'], label: 'Qualified', color: '#7181be' },
  { id: 'key_events', dbValues: ['Booking Made'], label: 'Key Events', color: '#7580d0' },
  { id: 'call_done', dbValues: ['High Intent'], label: 'Call Done', color: '#7c7ee0' },
  { id: 'proposal_sent', dbValues: ['Proposal Sent'], label: 'Proposal Sent', color: '#8478ec' },
  { id: 'closed_won', dbValues: ['Converted'], label: 'Closed Won', color: '#34d399' },
  { id: 'closed_lost', dbValues: ['Cold', 'Closed Lost'], label: 'Closed Lost', color: '#78716c' },
]

function mapLeadToStageId(lead: Lead): string {
  const s = lead.lead_stage || ''
  for (const stage of STAGES) {
    if (stage.dbValues.includes(s)) return stage.id
  }
  return 'new'
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
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

function ChannelIcon({ lead }: { lead: Lead }) {
  const ch = lead.last_touchpoint || lead.first_touchpoint
  if (ch === 'whatsapp') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#34d399">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.293-.175-2.828.84.84-2.828-.175-.293A8 8 0 1112 20z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  )
}

// --- Score dot ---
function ScoreDot({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span style={{ color: '#525252', fontSize: 11 }}>—</span>
  }
  const color = score >= 60 ? '#34d399' : score >= 30 ? '#fbbf24' : '#f87171'
  const bg = score >= 60 ? 'rgba(52,211,153,0.12)' : score >= 30 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ background: bg, color, padding: '1px 5px', borderRadius: 3, fontSize: 11, fontWeight: 700, lineHeight: '16px' }}>{score}</span>
    </span>
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

  // --- Computed ---

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STAGES.forEach((s) => (counts[s.id] = 0))
    leads.forEach((l) => { counts[mapLeadToStageId(l)]++ })
    return counts
  }, [leads])

  const maxCount = useMemo(() => Math.max(1, ...Object.values(stageCounts)), [stageCounts])

  const conversionPcts = useMemo(() => {
    const pcts: Record<string, number | null> = {}
    STAGES.forEach((s, i) => {
      if (i === 0) { pcts[s.id] = null; return }
      const prev = stageCounts[STAGES[i - 1].id]
      pcts[s.id] = prev > 0 ? Math.round((stageCounts[s.id] / prev) * 100) : 0
    })
    return pcts
  }, [stageCounts])

  const insights = useMemo(() => {
    const totalActive = leads.filter((l) => {
      const sid = mapLeadToStageId(l)
      return sid !== 'closed_won' && sid !== 'closed_lost'
    }).length

    const wonLeads = leads.filter((l) => mapLeadToStageId(l) === 'closed_won')
    const avgDays = wonLeads.length > 0
      ? Math.round(wonLeads.reduce((sum, l) => sum + daysBetween(l.created_at || null, l.last_interaction_at), 0) / wonLeads.length)
      : -1

    // Biggest drop-off: only consider transitions where previous stage has >0 leads
    // and the drop isn't 100% (which just means nobody progressed yet)
    let biggestDrop = { from: '', to: '', pct: -1 }
    for (let i = 1; i < STAGES.length - 1; i++) {
      const prev = stageCounts[STAGES[i - 1].id]
      const curr = stageCounts[STAGES[i].id]
      if (prev > 0 && curr < prev) {
        const drop = Math.round(((prev - curr) / prev) * 100)
        if (drop > biggestDrop.pct && drop < 100) {
          biggestDrop = { from: STAGES[i - 1].label, to: STAGES[i].label, pct: drop }
        }
      }
    }

    const won = stageCounts['closed_won'] || 0
    const lost = stageCounts['closed_lost'] || 0
    const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : -1

    return { totalActive, avgDays, biggestDrop, winRate }
  }, [leads, stageCounts])

  const tableLeads = useMemo(() => {
    let filtered = leads.filter((l) => {
      if (activeStage && mapLeadToStageId(l) !== activeStage) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(l.name || '').toLowerCase().includes(q) && !(l.phone || '').includes(q)) return false
      }
      return true
    })
    filtered.sort((a, b) => {
      if (sortBy === 'score') return (b.lead_score || 0) - (a.lead_score || 0)
      if (sortBy === 'activity') return new Date(b.last_interaction_at || 0).getTime() - new Date(a.last_interaction_at || 0).getTime()
      return daysBetween(b.created_at || null, b.last_interaction_at) - daysBetween(a.created_at || null, a.last_interaction_at)
    })
    return filtered
  }, [leads, activeStage, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(tableLeads.length / perPage))
  const pagedLeads = tableLeads.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [activeStage, search, sortBy])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading pipeline…</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Pipeline</h1>
        <span style={{ color: '#525252', fontSize: 12 }}>{leads.length} leads</span>
      </div>

      {/* ── FUNNEL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {STAGES.map((stage, i) => {
          const count = stageCounts[stage.id]
          const widthPct = Math.max(15, (count / maxCount) * 100)
          const conv = conversionPcts[stage.id]
          const isActive = activeStage === stage.id
          const isLast = i === STAGES.length - 1

          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {/* Bar */}
              <button
                onClick={() => setActiveStage(isActive ? null : stage.id)}
                className="funnel-bar"
                style={{
                  width: `${widthPct}%`,
                  minWidth: 120,
                  height: 38,
                  background: isActive ? stage.color : `${stage.color}14`,
                  borderLeft: isActive ? `3px solid #fff` : `3px solid ${stage.color}50`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px 0 10px',
                  cursor: 'pointer',
                  border: 'none',
                  borderLeftWidth: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: isActive ? '#e2e8f0' : `${stage.color}60`,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 8px rgba(0,0,0,0.25)' : 'none',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : 'var(--text-primary)', letterSpacing: '-0.1px' }}>
                  {stage.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#fff' : stage.color, fontVariantNumeric: 'tabular-nums' }}>
                  {count}
                </span>
              </button>

              {/* Conversion arrow */}
              {conv !== null && !isLast && (
                <span style={{ fontSize: 10, color: '#525252', marginLeft: 10, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {conv}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── INSIGHTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <InsightCard label="Active Pipeline" value={String(insights.totalActive)} sub="in progress" />
        <InsightCard label="Avg Time to Close" value={insights.avgDays >= 0 ? `${insights.avgDays}d` : 'No data'} sub={insights.avgDays >= 0 ? 'days to win' : ''} />
        <InsightCard
          label="Biggest Drop-off"
          value={insights.biggestDrop.pct > 0 ? `${insights.biggestDrop.pct}%` : 'No data'}
          sub={insights.biggestDrop.from ? `${insights.biggestDrop.from} → ${insights.biggestDrop.to}` : ''}
        />
        <InsightCard label="Win Rate" value={insights.winRate >= 0 ? `${insights.winRate}%` : 'No data'} sub={insights.winRate >= 0 ? 'won vs lost' : ''} />
      </div>

      {/* ── LEAD TABLE ── */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 260 }}>
            <MdSearch size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#525252' }} />
            <input
              type="text"
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['score', 'activity', 'days'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '4px 9px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)',
                  background: sortBy === s ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: sortBy === s ? 'var(--text-primary)' : '#525252',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {s === 'score' ? 'Score' : s === 'activity' ? 'Activity' : 'Days'}
              </button>
            ))}
          </div>
          {activeStage && (
            <button
              onClick={() => setActiveStage(null)}
              style={{ padding: '4px 9px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STAGES.find((s) => s.id === activeStage)?.color }} />
              {STAGES.find((s) => s.id === activeStage)?.label}
              <span style={{ opacity: 0.5, marginLeft: 2 }}>✕</span>
            </button>
          )}
          <span style={{ color: '#525252', fontSize: 11, marginLeft: 'auto' }}>
            {tableLeads.length}
          </span>
        </div>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.6fr 0.4fr 1fr 0.7fr 1fr', gap: 0, padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Name</span>
          <span>Stage</span>
          <span>Score</span>
          <span>Ch</span>
          <span>Last Activity</span>
          <span>Days</span>
          <span>City</span>
        </div>

        {/* Rows */}
        {pagedLeads.length === 0 ? (
          <div style={{ padding: '36px 14px', textAlign: 'center', color: '#525252', fontSize: 12 }}>
            No leads found
          </div>
        ) : (
          pagedLeads.map((lead) => {
            const stageObj = STAGES.find((s) => s.id === mapLeadToStageId(lead))
            const days = daysBetween(lead.created_at || null, lead.last_interaction_at || new Date().toISOString())
            return (
              <div
                key={lead.id}
                className="pipeline-row"
                style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.6fr 0.4fr 1fr 0.7fr 1fr', gap: 0, padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
                    {lead.name || 'Unknown'}
                  </div>
                  {lead.phone && (
                    <div style={{ color: '#525252', fontSize: 11, marginTop: 1 }}>{lead.phone}</div>
                  )}
                </div>
                <span>
                  <span style={{ background: `${stageObj?.color}15`, color: stageObj?.color, padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: '0.1px' }}>
                    {stageObj?.label}
                  </span>
                </span>
                <span><ScoreDot score={lead.lead_score} /></span>
                <span><ChannelIcon lead={lead} /></span>
                <span style={{ color: '#525252', fontSize: 12 }}>{relativeTime(lead.last_interaction_at)}</span>
                <span style={{ color: '#525252', fontSize: 12 }}>{days > 0 ? `${days}d` : '<1d'}</span>
                <span style={{ color: '#525252', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.city || ''}</span>
              </div>
            )
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? 'rgba(255,255,255,0.1)' : '#525252', padding: 2 }}
            >
              <MdChevronLeft size={18} />
            </button>
            <span style={{ color: '#525252', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? 'rgba(255,255,255,0.1)' : '#525252', padding: 2 }}
            >
              <MdChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .funnel-bar:hover { filter: brightness(1.2); }
        .pipeline-row:hover { background: rgba(255,255,255,0.02); }
        @media (max-width: 768px) {
          .funnel-bar { min-width: 100px !important; }
        }
      `}</style>
    </div>
  )
}

// --- Insight Card ---

function InsightCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ color: '#525252', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ color: '#525252', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
