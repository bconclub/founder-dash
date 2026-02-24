export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'text',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// POST /api/knowledge-base/upload — Upload file (PDF, DOC, DOCX, TXT)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Accepted: PDF, DOC, DOCX, TXT` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Extract content for text files; PDF/DOC deferred to embedding pipeline
    let content: string | null = null
    let embeddings_status: 'pending' | 'ready' = 'pending'

    if (file.type === 'text/plain') {
      content = await file.text()
      // Truncate to 100k chars
      if (content.length > 100000) {
        content = content.substring(0, 100000)
      }
      embeddings_status = 'ready'
    }
    // PDF and DOC: content extraction deferred to phase 2 (embedding pipeline)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        brand: 'proxe',
        type: fileType as 'pdf' | 'doc' | 'text',
        title: file.name,
        content,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        embeddings_status,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting file entry:', error)
      return NextResponse.json(
        { error: 'Failed to save file entry', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in knowledge base upload POST:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    )
  }
}
