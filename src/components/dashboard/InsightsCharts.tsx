'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface InsightsChartsProps {}

interface ChartData {
  date: string
  value: number
}

const dateRanges = [
  { label: '7D', days: 7 },
  { label: '28D', days: 28 },
  { label: '90D', days: 90 },
  { label: 'Custom', days: null },
]

export default function InsightsCharts({}: InsightsChartsProps) {
  const [selectedRange, setSelectedRange] = useState<number>(7)
  const [loading, setLoading] = useState(true)
  const [totalLeads, setTotalLeads] = useState<ChartData[]>([])
  const [totalConversations, setTotalConversations] = useState<ChartData[]>([])
  const [conversionRatio, setConversionRatio] = useState<ChartData[]>([])
  const [avgResponseTime, setAvgResponseTime] = useState<ChartData[]>([])

  useEffect(() => {
    fetchInsightsData()
  }, [selectedRange])

  const fetchInsightsData = async () => {
    setLoading(true)
    try {
      const days = dateRanges.find(r => r.days === selectedRange)?.days || 7
      
      // Fetch insights data from API
      const response = await fetch(`/api/dashboard/insights?days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch insights')
      const data = await response.json()

      setTotalLeads(data.totalLeads || [])
      setTotalConversations(data.totalConversations || [])
      setConversionRatio(data.conversionRatio || [])
      setAvgResponseTime(data.avgResponseTime || [])
    } catch (error) {
      console.error('Error fetching insights:', error)
      // Fallback to empty arrays on error
      setTotalLeads([])
      setTotalConversations([])
      setConversionRatio([])
      setAvgResponseTime([])
    }
    setLoading(false)
  }

  const ChartCard = ({
    title,
    value,
    data,
    suffix = '',
    formatValue = (v: number) => v.toString(),
  }: {
    title: string
    value: number | string
    data: ChartData[]
    suffix?: string
    formatValue?: (v: number) => string
  }) => (
    <div
      className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#262626] rounded-lg p-4 shadow-sm"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </h3>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? formatValue(value) : value}
          {suffix && <span className="text-lg ml-1" style={{ color: 'var(--text-secondary)' }}>{suffix}</span>}
        </p>
      </div>
      <div className="h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                stroke="var(--border-primary)"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                stroke="var(--border-primary)"
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Time Range:
        </span>
        {dateRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => range.days && setSelectedRange(range.days)}
            className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
            style={{
              background:
                selectedRange === range.days
                  ? 'var(--accent-primary)'
                  : 'var(--bg-tertiary)',
              color:
                selectedRange === range.days
                  ? 'white'
                  : 'var(--text-secondary)',
            }}
            disabled={range.days === null}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ChartCard
          title="Total Leads"
          value={totalLeads[totalLeads.length - 1]?.value || 0}
          data={totalLeads}
          formatValue={(v) => v.toLocaleString()}
        />
        <ChartCard
          title="Total Conversations"
          value={totalConversations[totalConversations.length - 1]?.value || 0}
          data={totalConversations}
          formatValue={(v) => v.toLocaleString()}
        />
        <ChartCard
          title="Conversion Ratio"
          value={conversionRatio[conversionRatio.length - 1]?.value || 0}
          data={conversionRatio}
          suffix="%"
          formatValue={(v) => v.toFixed(1)}
        />
        <ChartCard
          title="Avg Response Time"
          value={avgResponseTime[avgResponseTime.length - 1]?.value || 0}
          data={avgResponseTime}
          suffix="ms"
          formatValue={(v) => v.toLocaleString()}
        />
      </div>
    </div>
  )
}

