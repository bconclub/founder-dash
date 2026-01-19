'use client'

import { useEffect, useState } from 'react'

/**
 * Widget Page for Embed
 * 
 * This page serves the widget in an iframe for embedding.
 * Points to the web-agent server (port 3001) to display the actual ChatWidget.
 */
export default function WidgetPage() {
  const [widgetUrl, setWidgetUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null)
  const [showFallback, setShowFallback] = useState(true) // Show fallback by default

  useEffect(() => {
    // Get the web-agent URL from environment or use default
    // Points to the widget-only page in web-agent
    const agentUrl = process.env.NEXT_PUBLIC_WEB_AGENT_URL || 'http://localhost:3001'
    const url = `${agentUrl}/widget`
    setWidgetUrl(url)
    
    // Check if server is available with timeout
    const checkServer = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)
        
        await fetch(url, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        setServerAvailable(true)
        setShowFallback(false)
      } catch (error) {
        // Server not available
        setServerAvailable(false)
        setShowFallback(true)
      }
    }
    
    checkServer()
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A0F0A',
        color: '#E8D5B7'
      }}>
        <p>Loading widget...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      backgroundColor: 'transparent',
      position: 'relative'
    }}>
      {/* Iframe pointing to web-agent server - only show if server is available */}
      {!showFallback && serverAvailable === true && (
        <iframe
          src={widgetUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: 'transparent'
          }}
          title="Chat Widget"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="microphone; camera"
          onError={(e) => {
            console.error('Widget iframe error:', e)
            setServerAvailable(false)
            setShowFallback(true)
          }}
          onLoad={(e) => {
            console.log('Widget iframe loaded successfully')
            setServerAvailable(true)
            setShowFallback(false)
          }}
        />
      )}
      
      {/* Fallback message if iframe fails to load */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '40px',
          textAlign: 'center',
          color: '#E8D5B7',
          backgroundColor: '#1A0F0A',
          borderRadius: '8px',
          display: showFallback ? 'block' : 'none', // Show if server unavailable or loading
          zIndex: 1000,
          maxWidth: '600px',
          border: '1px solid rgba(201, 169, 97, 0.3)'
        }}
        id="widget-fallback"
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            borderRadius: '50%',
            backgroundColor: '#C9A961',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#1A0F0A',
            fontWeight: 'bold'
          }}>
            W
          </div>
        </div>
        <p style={{ marginBottom: '10px', fontSize: '18px', color: '#C9A961', fontWeight: '600' }}>
          Web-Agent Server Not Running
        </p>
        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '15px', lineHeight: '1.6' }}>
          The widget preview requires the web-agent server to be running.
        </p>
        <div style={{ 
          backgroundColor: 'rgba(201, 169, 97, 0.1)', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '15px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
            To start the server:
          </p>
          <code style={{ 
            fontSize: '11px', 
            opacity: 0.9, 
            display: 'block', 
            padding: '8px',
            backgroundColor: 'rgba(26, 15, 10, 0.5)',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            cd brand/windchasers/web-agent/build<br/>
            npm run dev
          </code>
        </div>
        <p style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'monospace', marginTop: '10px' }}>
          Expected URL: {widgetUrl}
        </p>
      </div>
    </div>
  )
}
