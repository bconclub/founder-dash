# Knowledge Base Manual Entry Guide

## Overview

The Windchasers knowledge base uses a manual entry system (like PROXe) where admins add entries directly in the Supabase dashboard. Entries are immediately searchable via enhanced PostgreSQL full-text search.

## Table Structure

The `knowledge_base` table has the following columns:

- `id` (UUID) - Auto-generated unique identifier
- `brand` (TEXT) - Must be 'windchasers'
- `question` (TEXT) - The question users might ask (optional but recommended)
- `answer` (TEXT) - The answer to provide (optional but recommended)
- `content` (TEXT) - Summary/description text (required)
- `category` (TEXT) - Main category (e.g., 'programs', 'pricing', 'faq', 'eligibility')
- `subcategory` (TEXT) - Granular categorization (e.g., 'dgca', 'helicopter', 'cost', 'medical')
- `keywords` (TEXT[]) - Array of search keywords for better matching
- `title` (TEXT) - Optional title
- `description` (TEXT) - Optional description
- `metadata` (JSONB) - Additional structured data
- `created_at` (TIMESTAMP) - Auto-generated
- `updated_at` (TIMESTAMP) - Auto-generated

## Manual Entry Workflow

1. **Open Supabase Dashboard**
   - Navigate to your Windchasers Supabase project
   - Go to Table Editor → `knowledge_base` table

2. **Add New Entry**
   - Click "Insert" → "Insert row"
   - Fill in the fields:
     - `brand`: `windchasers` (required)
     - `question`: The question users might ask (e.g., "How much does pilot training cost?")
     - `answer`: The answer to provide (e.g., "Pilot training investment: ₹40-75 lakhs...")
     - `content`: Summary/description text (required)
     - `category`: Main category (e.g., 'pricing', 'programs', 'faq')
     - `subcategory`: More specific category (e.g., 'dgca', 'helicopter', 'cost')
     - `keywords`: Array of keywords (e.g., `['pilot training', 'cost', 'price', 'fees']`)
     - `title`: Optional title
     - `description`: Optional description
   - Click "Save"

3. **Entry is Immediately Searchable**
   - No additional steps needed
   - Full-text search indexes are automatically updated
   - The entry will be found by the chat API when users ask related questions

## Best Practices

### Question & Answer Format
- **Question**: Write questions as users would ask them naturally
  - Good: "How much does pilot training cost?"
  - Good: "What are the eligibility requirements?"
  - Avoid: "Pilot training cost information"

- **Answer**: Provide clear, concise answers
  - Include key details (costs, timelines, requirements)
  - Keep answers factual and accurate
  - Match the tone of the Windchasers brand

### Categories & Subcategories
Use consistent categories for better organization:

**Categories:**
- `programs` - Course/program information
- `pricing` - Cost and payment information
- `faq` - Frequently asked questions
- `eligibility` - Requirements and qualifications
- `timeline` - Duration and scheduling
- `about` - Brand information
- `process` - Application and enrollment process

**Subcategories (examples):**
- `dgca` - DGCA ground classes
- `helicopter` - Helicopter training
- `international` - International flight training
- `drone` - Drone training
- `cabin_crew` - Cabin crew training
- `cost` - Pricing details
- `medical` - Medical requirements
- `financing` - Payment and loan options

### Keywords
Add relevant keywords to improve search matching:
- Include synonyms and variations
- Include common misspellings
- Include related terms users might search for

Example: `['pilot training', 'pilot course', 'CPL', 'commercial pilot', 'flight training']`

## Search Functionality

The chat API uses the `search_knowledge_base()` PostgreSQL function which:
- Searches across `question`, `answer`, and `content` fields simultaneously
- Uses PostgreSQL full-text search (tsvector) with relevance ranking
- Prioritizes exact matches in the `question` field
- Falls back to ILIKE search if full-text search returns no results
- Returns top 3-5 most relevant results

## Example Entry

```sql
INSERT INTO knowledge_base (
  brand,
  question,
  answer,
  content,
  category,
  subcategory,
  keywords
) VALUES (
  'windchasers',
  'How much does DGCA ground classes cost?',
  'DGCA Ground Classes Pricing: Package 1 (4 Subjects) - ₹2.35 lakhs + GST, Duration 3-4 months. Package 2 (6 Subjects Complete) - ₹2.75 lakhs + GST, Duration 4-5 months.',
  'DGCA Ground Classes pricing information for 4 and 6 subject packages.',
  'pricing',
  'dgca',
  ARRAY['dgca', 'ground classes', 'cost', 'price', 'fees', '2.35 lakhs', '2.75 lakhs']
);
```

## Migration

Run migration `023_enhance_knowledge_base.sql` to:
- Add `question`, `answer`, and `subcategory` columns
- Create enhanced full-text search indexes
- Create `search_knowledge_base()` function for ranked search

## Notes

- Entries are searchable immediately after adding (no embedding generation needed)
- The system uses PostgreSQL's built-in full-text search - no external APIs required
- All entries must have `brand = 'windchasers'`
- The `content` field is required, but `question` and `answer` are optional (though recommended)
