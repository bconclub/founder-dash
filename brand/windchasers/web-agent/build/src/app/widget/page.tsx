'use client'

import React from 'react'
import { ChatWidget } from '@/components/ChatWidget'
import '@/styles/theme.css'

/**
 * Widget-only page for embedding
 * This page shows only the ChatWidget without any page content
 */
export default function WidgetPage() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ChatWidget widgetStyle="searchbar" />
    </div>
  )
}
