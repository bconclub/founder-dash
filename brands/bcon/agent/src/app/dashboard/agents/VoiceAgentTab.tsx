'use client';
import { useState } from 'react';
import { MdContentCopy, MdCheckCircle, MdPhone } from 'react-icons/md';

export default function VoiceAgentTab() {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [calling, setCalling] = useState(false);
  const [copied, setCopied] = useState(false);

  const voiceNumber = '+918046733388';

  async function triggerTestCall() {
    if (!phone) return;
    setCalling(true);
    setStatus('Initiating call...');
    try {
      const res = await fetch('/api/agent/voice/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setStatus(data.success ? `Call initiated to ${phone}` : `Failed: ${data.error}`);
    } catch {
      setStatus('Error initiating call');
    } finally {
      setCalling(false);
    }
  }

  function copyNumber() {
    navigator.clipboard.writeText(voiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* Status */}
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Voice Agent</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{voiceNumber} · voiceproxe.bconclub.com</p>
        </div>
      </div>

      {/* Two-column sections */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Section 1 — Inbound (Call Us) */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}>
          <MdPhone size={32} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Call to Test</h2>
          <p style={{
            color: 'var(--text-primary)',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '1px',
          }}>{voiceNumber}</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Call this number to speak with the AI agent
          </p>
          <button
            onClick={copyNumber}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: copied ? 'var(--button-bg)' : 'var(--bg-tertiary)',
              color: copied ? 'var(--text-button)' : 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
            }}
          >
            {copied ? <MdCheckCircle size={16} /> : <MdContentCopy size={16} />}
            {copied ? 'Copied!' : 'Copy Number'}
          </button>
        </div>

        {/* Section 2 — Outbound (We Call You) */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Get a Call</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter your number and the AI agent will call you
          </p>
          <input
            type="text"
            placeholder="Your number (with country code)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg px-4 py-2.5 text-sm outline-none w-full"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          />
          <button
            onClick={triggerTestCall}
            disabled={calling}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--text-button)',
              cursor: calling ? 'not-allowed' : 'pointer',
            }}
          >
            {calling ? 'Calling...' : 'Call Me Now'}
          </button>
          {status && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{status}</p>}
        </div>
      </div>
    </div>
  );
}
