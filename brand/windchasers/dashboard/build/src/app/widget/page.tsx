'use client'

import { useEffect, useState } from 'react'

// Make this route public - no authentication required
export const dynamic = 'force-dynamic'

/**
 * Widget Preview Page
 * 
 * Shows a mock landing page with the chat widget embedded,
 * demonstrating how it will look on a real website.
 */
export default function WidgetPage() {
  const [widgetUrl, setWidgetUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null)
  const [showFallback, setShowFallback] = useState(true)

  useEffect(() => {
    // Get the web-agent URL from environment or use default
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
        setServerAvailable(false)
        setShowFallback(true)
      }
    }
    
    checkServer()
    setIsLoading(false)
  }, [])

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      backgroundColor: '#1A0F0A',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mock Landing Page Content */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Main Heading */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '700',
          color: '#C9A961',
          textAlign: 'center',
          marginBottom: '20px',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Windchasers Pilot Training Academy
        </h1>
        
        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#E8D5B7',
          textAlign: 'center',
          maxWidth: '800px',
          padding: '0 24px',
          lineHeight: '1.6',
          opacity: 0.9
        }}>
          Your gateway to aviation excellence. Explore our courses and start your journey today.
        </p>
      </div>

      {/* Chat Widget - Embedded as overlay */}
      {!showFallback && serverAvailable === true ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          <iframe
            src={widgetUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              pointerEvents: 'auto'
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
        </div>
      ) : (
        // Fallback message overlay
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '40px',
            textAlign: 'center',
            color: '#E8D5B7',
            backgroundColor: 'rgba(26, 15, 10, 0.95)',
            borderRadius: '8px',
            zIndex: 10001,
            maxWidth: '600px',
            border: '1px solid rgba(201, 169, 97, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
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
      )}
    </div>
  )
}
