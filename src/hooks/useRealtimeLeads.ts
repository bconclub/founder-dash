'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  source: string | null
  timestamp: string
  status: string | null
  booking_date: string | null
  booking_time: string | null
}

export function useRealtimeLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('unified_leads')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1000)

        if (error) throw error
        setLeads(data || [])
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads')
        setLoading(false)
      }
    }

    fetchLeads()

    // Subscribe to real-time changes from dashboard_leads
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_leads',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            const newLead = payload.new
            if (newLead.name || newLead.email || newLead.phone) {
              setLeads((prev) => [newLead, ...prev].slice(0, 1000))
            }
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((lead) =>
                lead.id === payload.new.id ? payload.new : lead
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { leads, loading, error }
}


