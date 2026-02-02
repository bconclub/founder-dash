'use client'

import React, { useState, useEffect } from 'react'
import { ChatWidget } from '@/components/ChatWidget'

/**
 * Bubble-only page for iframe embedding
 * This page shows only the ChatWidget in a bubble-style container
 * Used by embed.js to load the widget in an iframe
 * 
 * CRITICAL: Override body background to transparent in bubble mode
 * The global styles set body { background: #0a0a0a } which creates a dark box
 */
export default function BubblePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Override the global dark background on document body
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.backgroundColor = 'transparent'
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
      <div style={{ width: '100%', height: '100%' }}>
        <ChatWidget
          apiUrl="https://agent.windchasers.in/api/chat"
          widgetStyle="bubble"
        />
      </div>
    </div>
  )
}
