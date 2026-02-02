'use client'

import React, { useState, useEffect } from 'react'
import { ChatWidget } from '@/components/ChatWidget'

/**
 * Bubble-only page for iframe embedding
 * Renders just the ChatWidget with transparent background
 * No wrapper - widget handles its own positioning
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
    <ChatWidget
      apiUrl="https://agent.windchasers.in/api/chat"
      widgetStyle="bubble"
    />
  )
}
