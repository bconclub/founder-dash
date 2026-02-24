export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Basic HTML tag stripping for content extraction
function stripHtmlTags(html: string): string {
  // Remove script and style blocks entirely
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// POST /api/knowledge-base/url — Add URL entry with basic scraping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title } = body

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.trim())
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Auto-generate title from hostname if not provided
    const itemTitle = title?.trim() || parsedUrl.hostname

    // Attempt basic content fetch
    let content: string | null = null
    let status: 'pending' | 'ready' | 'error' = 'pending'
    let errorMessage: string | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PROXe-Bot/1.0',
        },
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('text/html') || contentType.includes('text/plain')) {
          const html = await response.text()
          content = stripHtmlTags(html)
          // Truncate to 100k chars to avoid DB bloat
          if (content.length > 100000) {
            content = content.substring(0, 100000)
          }
          status = content.length > 50 ? 'ready' : 'pending'
        }
      } else {
        errorMessage = `Fetch returned status ${response.status}`
        status = 'pending'
      }
    } catch (fetchError) {
      // Fetch failed — still save the entry as pending
      console.warn('URL fetch failed (will retry later):', fetchError instanceof Error ? fetchError.message : fetchError)
      errorMessage = fetchError instanceof Error ? fetchError.message : 'Fetch failed'
      status = 'pending'
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        brand: 'proxe',
        type: 'url' as const,
        title: itemTitle,
        source_url: parsedUrl.toString(),
        content,
        embeddings_status: status,
        error_message: errorMessage,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting URL entry:', error)
      return NextResponse.json(
        { error: 'Failed to save URL entry', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in knowledge base url POST:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    )
  }
}
