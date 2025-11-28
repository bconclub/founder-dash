'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  MdInbox, 
  MdLanguage, 
  MdChat, 
  MdPhone, 
  MdShare, 
  MdSend, 
  MdSearch 
} from 'react-icons/md'
import LoadingOverlay from '@/components/dashboard/LoadingOverlay'

// Types
interface Conversation {
  lead_id: string
  lead_name: string
  lead_email: string
  lead_phone: string
  channel: 'web' | 'whatsapp' | 'voice' | 'social'
  last_message: string
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  lead_id: string
  channel: string
  sender: 'customer' | 'agent' | 'system'
  content: string
  message_type: string
  metadata: any
  created_at: string
}

export default function InboxPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Fetch conversations (grouped by lead_id)
  useEffect(() => {
    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter])

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedLeadId) {
      fetchMessages(selectedLeadId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId])

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Refresh conversations list
          fetchConversations()
          // If viewing this conversation, add message
          if (payload.new.lead_id === selectedLeadId) {
            setMessages(prev => [...prev, payload.new as Message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId])

  async function fetchConversations() {
    setLoading(true)
    try {
      // Fetch all messages ordered by most recent
      let query = supabase
        .from('messages')
        .select('lead_id, channel, content, sender, created_at')
        .order('created_at', { ascending: false })

      // Apply channel filter if not "all"
      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter)
      }

      const { data: messagesData, error: messagesError } = await query

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        setLoading(false)
        return
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found')
        setConversations([])
        setLoading(false)
        return
      }

      console.log('Fetched messages:', messagesData.length)

      // Group messages by lead_id - keep only the latest message per lead
      const conversationMap = new Map<string, any>()

      for (const msg of messagesData) {
        if (!msg.lead_id) continue

        if (!conversationMap.has(msg.lead_id)) {
          conversationMap.set(msg.lead_id, {
            lead_id: msg.lead_id,
            channel: msg.channel,
            last_message: msg.content || '(No content)',
            last_message_at: msg.created_at,
            message_count: 1
          })
        } else {
          // Increment message count for existing conversation
          conversationMap.get(msg.lead_id).message_count++
        }
      }

      console.log('Unique conversations:', conversationMap.size)

      // Get lead details for all conversations
      const leadIds = Array.from(conversationMap.keys())

      if (leadIds.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from('all_leads')
        .select('id, customer_name, email, phone')
        .in('id', leadIds)

      if (leadsError) {
        console.error('Error fetching leads:', leadsError)
      }

      console.log('Fetched leads:', leadsData?.length)

      // Build final conversations array
      const conversationsArray: Conversation[] = []

      for (const [leadId, convData] of conversationMap) {
        const lead = leadsData?.find((l: any) => l.id === leadId)

        conversationsArray.push({
          lead_id: leadId,
          lead_name: lead?.customer_name || 'Unknown',
          lead_email: lead?.email || '',
          lead_phone: lead?.phone || '',
          channel: convData.channel,
          last_message: convData.last_message,
          last_message_at: convData.last_message_at,
          unread_count: 0
        })
      }

      // Sort by most recent message first
      conversationsArray.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )

      console.log('Final conversations:', conversationsArray)
      setConversations(conversationsArray)

    } catch (err) {
      console.error('Error in fetchConversations:', err)
    }
    setLoading(false)
  }

  async function fetchMessages(leadId: string) {
    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      setMessages([])
    }
    setMessagesLoading(false)
  }

  // Channel icon helper
  function getChannelIcon(channel: string) {
    switch (channel) {
      case 'web': return <span className="text-blue-500"><MdLanguage size={16} /></span>
      case 'whatsapp': return <span className="text-green-500"><MdChat size={16} /></span>
      case 'voice': return <span className="text-purple-500"><MdPhone size={16} /></span>
      case 'social': return <span className="text-pink-500"><MdShare size={16} /></span>
      default: return <MdInbox size={16} />
    }
  }

  // Time ago helper
  function timeAgo(timestamp: string) {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Format timestamp for messages
  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.lead_name?.toLowerCase().includes(query) ||
      conv.lead_phone?.includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    )
  })

  const selectedConversation = conversations.find(c => c.lead_id === selectedLeadId)

  return (
    <div className="h-[calc(100vh-32px)] flex relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Loading Overlay */}
      <LoadingOverlay 
        isLoading={loading || messagesLoading} 
        message={loading ? "Loading conversations..." : "Loading messages..."} 
      />
      
      {/* Left Panel - Conversations List */}
      <div 
        className="w-[350px] flex flex-col border-r"
        style={{ 
          background: 'var(--bg-secondary)', 
          borderColor: 'var(--border-primary)' 
        }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Inbox
          </h1>
          
          {/* Search */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              <MdSearch size={20} />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Channel Filter */}
          <div className="flex gap-2 mt-3">
            {['all', 'web', 'whatsapp', 'voice', 'social'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: channelFilter === ch ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: channelFilter === ch ? 'white' : 'var(--text-secondary)'
                }}
              >
                {ch === 'all' ? 'All' : ch.charAt(0).toUpperCase() + ch.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.lead_id}
                onClick={() => setSelectedLeadId(conv.lead_id)}
                className="p-4 cursor-pointer border-b transition-colors"
                style={{
                  background: selectedLeadId === conv.lead_id ? 'var(--bg-tertiary)' : 'transparent',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(conv.channel)}
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {conv.lead_name || conv.lead_phone || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {timeAgo(conv.last_message_at)}
                  </span>
                </div>
                <p 
                  className="text-sm truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {conv.last_message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Messages */}
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        {!selectedLeadId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
                <MdInbox size={64} />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>Select a conversation to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div 
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center gap-3">
                {getChannelIcon(selectedConversation?.channel || 'web')}
                <div>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedConversation?.lead_name || 'Unknown'}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedConversation?.lead_phone} • {selectedConversation?.channel}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  No messages yet
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className="max-w-[70%] rounded-lg px-4 py-2"
                      style={{
                        background: msg.sender === 'customer' ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                        color: msg.sender === 'customer' ? 'var(--text-primary)' : 'white'
                      }}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p 
                        className="text-xs mt-1 text-right"
                        style={{ color: msg.sender === 'customer' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.7)' }}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input (Read-only for now) */}
            <div 
              className="p-4 border-t"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div 
                className="flex items-center gap-2 px-4 py-3 rounded-lg"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <input
                  type="text"
                  placeholder="Reply feature coming soon..."
                  disabled
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                />
                <button 
                  disabled
                  className="p-2 rounded-lg opacity-50"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  <MdSend size={20} color="white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
