'use client'

import React, { useState, useEffect } from 'react'
import { ChatWidget } from '@/components/ChatWidget'

/**
 * Bubble-only page for iframe embedding
 * Uses a dedicated layout.tsx that sets transparent backgrounds on html/body
 * to prevent the global #0a0a0a background from showing
 */
export default function BubblePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div style={{
      background: 'transparent',
      width: '100%',
      height: '100%',
      position: 'fixed',
      bottom: 0,
      right: 0,
      zIndex: 999999,
      margin: 0,
      padding: 0,
      border: 'none',
      overflow: 'visible',
      pointerEvents: 'auto'
    }}>
      <ChatWidget
        apiUrl="https://agent.windchasers.in/api/chat"
        widgetStyle="bubble"
      />
    </div>
  )
}
