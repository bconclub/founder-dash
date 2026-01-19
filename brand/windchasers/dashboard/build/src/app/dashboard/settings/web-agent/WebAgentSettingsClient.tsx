'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function WebAgentSettingsClient() {
  const [isResetting, setIsResetting] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Auto-load preview when component mounts
  useEffect(() => {
    // Ensure iframe loads when component mounts
    if (iframeRef.current) {
      iframeRef.current.src = '/widget'
    }
  }, [])

  const handleResetWidget = () => {
    if (typeof window === 'undefined') return
    
    setIsResetting(true)
    try {
      // Clear all localStorage items related to the widget
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('windchasers-') ||
          key.startsWith('chat-') ||
          key.startsWith('session-') ||
          key.includes('widget') ||
          key.includes('chat')
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Reload the iframe to reset the widget state
      if (iframeRef.current) {
        iframeRef.current.src = '/widget'
      }
      
      setTimeout(() => {
        setIsResetting(false)
      }, 500)
    } catch (error) {
      console.error('Error resetting widget:', error)
      setIsResetting(false)
    }
  }

  const embedCode = `<script src="https://proxe.windchasers.in/widget/embed.js"></script>`

  return (
    <DashboardLayout>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Fullscreen Preview Section - Desktop 100vh */}
        <div 
          style={{
            width: '100%',
            height: '100vh',
            position: 'relative',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header with controls */}
          <div 
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                Widget Preview
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                Live preview of your chat widget
              </p>
            </div>
            <button
              onClick={handleResetWidget}
              disabled={isResetting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isResetting ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                cursor: isResetting ? 'not-allowed' : 'pointer',
                opacity: isResetting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isResetting) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isResetting) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }
              }}
            >
              {isResetting ? 'Resetting...' : 'Reset Widget'}
            </button>
          </div>

          {/* Fullscreen Widget Container */}
          <div 
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/widget"
              className="w-full h-full border-0"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Widget Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              allow="microphone; camera"
              onError={(e) => {
                console.error('Widget iframe error:', e)
              }}
              onLoad={(e) => {
                console.log('Widget iframe loaded')
              }}
            />
          </div>
        </div>

        {/* Installation Code Section - Below Preview */}
        <div 
          style={{
            width: '100%',
            padding: '24px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Installation
            </h2>
            
            <div className="p-6 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Add this script tag to your website to embed the chat widget:
              </p>
              
              <div className="relative">
                <pre
                  className="p-4 rounded-lg overflow-x-auto text-sm font-mono"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <code>{embedCode}</code>
                </pre>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode)
                    // You could add a toast notification here
                  }}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                  }}
                >
                  Copy
                </button>
              </div>
              
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                  <strong>Note:</strong> The widget will automatically initialize when the script loads. 
                  Make sure to place this script tag before the closing &lt;/body&gt; tag for best performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
