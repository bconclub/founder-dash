'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  MdCode,
  MdRefresh,
  MdContentCopy,
  MdCheckCircle,
  MdInfoOutline,
  MdFiberManualRecord
} from 'react-icons/md'

export default function WebAgentSettingsClient() {
  const [isResetting, setIsResetting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '/widget'
    }
  }, [])

  const handleResetWidget = () => {
    if (typeof window === 'undefined') return
    setIsResetting(true)
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('bcon-') ||
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
      if (iframeRef.current) {
        iframeRef.current.src = '/widget'
      }
      setTimeout(() => setIsResetting(false), 800)
    } catch (error) {
      console.error('Error resetting widget:', error)
      setIsResetting(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const embedCode = `<script src="${appUrl}/api/widget/embed.js"></script>`

  return (
    <DashboardLayout>
      <div style={{
        width: 'calc(100% + 64px)',
        height: 'calc(100vh - 48px)',
        margin: '-24px -32px',
        padding: 0,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left Sidebar — controls */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 16px',
          gap: '16px',
          overflowY: 'auto',
        }}>
          {/* Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Web Agent
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '9px',
                fontWeight: 'bold',
                textTransform: 'uppercase' as const,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}>
                <MdFiberManualRecord size={6} className="animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Preview your widget as visitors see it
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-primary)' }} />

          {/* Embed Code Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MdCode size={14} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Installation Code
              </span>
            </div>
            <div
              className="rounded-lg overflow-x-auto text-[10px] font-mono relative"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--accent-primary)',
                padding: '10px',
                paddingRight: '36px',
              }}
            >
              <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{embedCode}</code>
              <button
                onClick={handleCopyCode}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded transition-all"
                style={{
                  backgroundColor: copySuccess ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: copySuccess ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                }}
                title="Copy to clipboard"
              >
                {copySuccess ? <MdCheckCircle size={12} /> : <MdContentCopy size={12} />}
              </button>
            </div>

            <div
              className="mt-3 p-3 rounded-lg flex gap-2"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                border: '1px dashed rgba(139, 92, 246, 0.2)',
              }}
            >
              <MdInfoOutline size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '1px' }} />
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Add before the closing <code style={{ color: 'var(--accent-primary)' }}>&lt;/body&gt;</code> tag on your website.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-primary)' }} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleResetWidget}
              disabled={isResetting}
              className="w-full px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                cursor: isResetting ? 'not-allowed' : 'pointer',
                opacity: isResetting ? 0.6 : 1,
              }}
            >
              <MdRefresh size={14} className={isResetting ? 'animate-spin' : ''} />
              {isResetting ? 'Resetting...' : 'Reset Widget'}
            </button>
          </div>
        </div>

        {/* Right — Full-bleed widget preview (behaves like a real page) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <iframe
            ref={iframeRef}
            src="/widget"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title="Widget Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="microphone; camera"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
