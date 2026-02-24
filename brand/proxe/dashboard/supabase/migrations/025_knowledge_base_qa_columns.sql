-- Migration 025: Add Q&A structure columns to knowledge_base
-- Enables structured question/answer entries with categories and tags.

-- ============================================
-- 1. ADD COLUMNS
-- ============================================

ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS question TEXT,
  ADD COLUMN IF NOT EXISTS answer TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 2. UPDATE SEARCH RPC to also search question/answer fields
-- ============================================
-- Replaces the search_knowledge_base function to:
-- 1. Search knowledge_base_chunks (existing chunk-level full-text + vector)
-- 2. Also search parent knowledge_base question/answer/content directly
--    for Q&A entries that may have short content (no chunks needed)

CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_text TEXT,
  query_embedding vector(384) DEFAULT NULL,
  match_limit INTEGER DEFAULT 5,
  filter_brand TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_subcategory TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  knowledge_base_id UUID,
  content TEXT,
  chunk_index INTEGER,
  title TEXT,
  source_type TEXT,
  relevance FLOAT,
  search_method TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('english', query_text);

  RETURN QUERY
  WITH ranked AS (
    -- 1. Chunk-level full-text search
    SELECT
      c.id,
      c.knowledge_base_id,
      c.content,
      c.chunk_index,
      kb.title,
      kb.type AS source_type,
      ts_rank_cd(c.fts_vector, ts_query)::FLOAT AS relevance,
      'fulltext'::TEXT AS search_method
    FROM knowledge_base_chunks c
    JOIN knowledge_base kb ON kb.id = c.knowledge_base_id
    WHERE c.fts_vector @@ ts_query
      AND (filter_brand IS NULL OR c.brand = filter_brand)
      AND kb.embeddings_status = 'ready'

    UNION ALL

    -- 2. Q&A direct search on parent knowledge_base (question + answer fields)
    SELECT
      kb.id,
      kb.id AS knowledge_base_id,
      COALESCE(kb.answer, kb.content, '') AS content,
      0 AS chunk_index,
      COALESCE(kb.question, kb.title) AS title,
      kb.type AS source_type,
      ts_rank_cd(
        to_tsvector('english',
          coalesce(kb.question, '') || ' ' ||
          coalesce(kb.answer, '') || ' ' ||
          coalesce(kb.content, '')
        ),
        ts_query
      )::FLOAT AS relevance,
      'qa_match'::TEXT AS search_method
    FROM knowledge_base kb
    WHERE to_tsvector('english',
        coalesce(kb.question, '') || ' ' ||
        coalesce(kb.answer, '') || ' ' ||
        coalesce(kb.content, '')
      ) @@ ts_query
      AND (filter_brand IS NULL OR kb.brand = filter_brand)
      AND kb.embeddings_status = 'ready'
      AND (filter_category IS NULL OR kb.category = filter_category)
      AND (filter_subcategory IS NULL OR kb.subcategory = filter_subcategory)

    UNION ALL

    -- 3. Vector similarity search (only when embedding provided)
    SELECT
      c.id,
      c.knowledge_base_id,
      c.content,
      c.chunk_index,
      kb.title,
      kb.type AS source_type,
      (1 - (c.embedding <=> query_embedding))::FLOAT AS relevance,
      'vector'::TEXT AS search_method
    FROM knowledge_base_chunks c
    JOIN knowledge_base kb ON kb.id = c.knowledge_base_id
    WHERE query_embedding IS NOT NULL
      AND c.embedding IS NOT NULL
      AND (filter_brand IS NULL OR c.brand = filter_brand)
      AND kb.embeddings_status = 'ready'
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_limit
  ),
  deduplicated AS (
    SELECT DISTINCT ON (ranked.id)
      ranked.*
    FROM ranked
    ORDER BY ranked.id, ranked.relevance DESC
  )
  SELECT
    deduplicated.id,
    deduplicated.knowledge_base_id,
    deduplicated.content,
    deduplicated.chunk_index,
    deduplicated.title,
    deduplicated.source_type,
    deduplicated.relevance,
    deduplicated.search_method
  FROM deduplicated
  ORDER BY deduplicated.relevance DESC
  LIMIT match_limit;
END;
$$;

-- ============================================
-- 3. INDEX for Q&A full-text search on parent table
-- ============================================

CREATE INDEX IF NOT EXISTS idx_kb_qa_fts
  ON knowledge_base USING GIN(
    to_tsvector('english',
      coalesce(question, '') || ' ' ||
      coalesce(answer, '') || ' ' ||
      coalesce(content, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_kb_category
  ON knowledge_base(category);
