-- Test script to manually insert a message and verify it works
-- This helps identify if the issue is with the code or database permissions

-- Test 1: Insert a message directly (bypasses application code)
INSERT INTO conversations (
  lead_id,
  channel,
  sender,
  content,
  message_type,
  metadata
) VALUES (
  'c5338c60-5aac-4555-bf2f-e949ee776aca',
  'web',
  'customer',
  'Test message from SQL',
  'text',
  '{"test": true, "manual_insert": true}'::jsonb
)
RETURNING id, lead_id, created_at;

-- Test 2: Verify it was inserted
SELECT 
  id,
  lead_id,
  channel,
  sender,
  content,
  created_at
FROM conversations
WHERE lead_id = 'c5338c60-5aac-4555-bf2f-e949ee776aca'
ORDER BY created_at DESC
LIMIT 5;

-- Test 3: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations';

-- Test 4: Check if service role can insert (run as service role)
-- This requires running with service role credentials
-- SELECT current_user, current_setting('role');
