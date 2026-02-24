'use client'

import { useState } from 'react'
import { MdAdd } from 'react-icons/md'

interface TextInputProps {
  onSubmit: () => void
}

export default function TextInput({ onSubmit }: TextInputProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/knowledge-base/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to save')
        return
      }

      setTitle('')
      setContent('')
      setSuccess(true)
      onSubmit()
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Pricing Information, Return Policy"
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          />
        </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type your knowledge content here..."
            rows={8}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {content.length > 0 ? `${content.length.toLocaleString()} characters` : 'Enter text that your AI agent should know'}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent-primary)' }}
        >
          <MdAdd size={18} />
          {submitting ? 'Saving...' : 'Add Text'}
        </button>

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}
          >
            Text entry saved successfully!
          </div>
        )}
      </div>
    </form>
  )
}
