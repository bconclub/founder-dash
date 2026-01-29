-- Diagnostic queries for lead: c5338c60-5aac-4555-bf2f-e949ee776aca
-- Session: 1c2cd816-2d0c-4a8d-b88b-e1f75e2868d5

-- 1. Check if ANY messages exist for this lead
SELECT 
  COUNT(*) as message_count,
  COUNT(CASE WHEN sender = 'customer' THEN 1 END) as customer_messages,
  COUNT(CASE WHEN sender = 'agent' THEN 1 END) as agent_messages,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message
FROM conversations
WHERE lead_id = 'c5338c60-5aac-4555-bf2f-e949ee776aca';

-- 2. List all messages for this lead (if any exist)
SELECT 
  id,
  lead_id,
  channel,
  sender,
  LEFT(content, 100) as content_preview,
  message_type,
  created_at,
  metadata
FROM conversations
WHERE lead_id = 'c5338c60-5aac-4555-bf2f-e949ee776aca'
ORDER BY created_at ASC;

-- 3. Check recent messages across all leads (to see if inserts are working at all)
SELECT 
  c.id,
  c.lead_id,
  c.channel,
  c.sender,
  LEFT(c.content, 50) as content_preview,
  c.created_at,
  al.customer_name,
  al.phone
FROM conversations c
LEFT JOIN all_leads al ON c.lead_id = al.id
WHERE al.brand = 'windchasers'
ORDER BY c.created_at DESC
LIMIT 20;

-- 4. Verify session-link to lead
SELECT 
  ws.external_session_id,
  ws.lead_id,
  ws.customer_name,
  ws.customer_phone,
  ws.customer_email,
  ws.created_at as session_created,
  ws.updated_at as session_updated,
  al.id as lead_exists,
  al.created_at as lead_created
FROM web_sessions ws
LEFT JOIN all_leads al ON ws.lead_id = al.id
WHERE ws.external_session_id = '1c2cd816-2d0c-4a8d-b88b-e1f75e2868d5';

-- 5. Check if there are any messages with similar lead_ids (typo check)
SELECT 
  lead_id,
  COUNT(*) as count
FROM conversations
WHERE lead_id::text LIKE 'c5338c60%'
GROUP BY lead_id;

-- 6. Check RLS policies on conversations table
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
