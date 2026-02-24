export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { chunkText } from '@/lib/knowledgeProcessor'
import { NextRequest, NextResponse } from 'next/server'

const BRAND = process.env.NEXT_PUBLIC_BRAND || 'proxe'

// POST /api/knowledge-base/text — Add manual text entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const trimmedContent = content.trim()
    const chunks = chunkText(trimmedContent)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        brand: BRAND,
        type: 'text' as const,
        title: title.trim(),
        content: trimmedContent,
        chunks,
        embeddings_status: 'ready' as const,
        metadata: {
          totalChunks: chunks.length,
          totalCharacters: trimmedContent.length,
          estimatedTokens: Math.ceil(trimmedContent.length / 4),
          extractionMethod: 'manual',
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting text entry:', error)
      return NextResponse.json(
        { error: 'Failed to save text entry', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in knowledge base text POST:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    )
  }
}
