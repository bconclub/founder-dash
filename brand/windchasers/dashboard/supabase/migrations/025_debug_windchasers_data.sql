-- Diagnostic query to check windchasers data in leads
-- Run this FIRST to see what data exists

-- 1. Check if any leads have windchasers data in unified_context
SELECT 
  id,
  customer_name,
  email,
  phone,
  unified_context,
  unified_context->'windchasers' as windchasers_data,
  unified_context->'windchasers'->>'user_type' as user_type,
  unified_context->'windchasers'->>'course_interest' as course_interest,
  unified_context->'windchasers'->>'plan_to_fly' as plan_to_fly,
  unified_context->'windchasers'->>'timeline' as timeline,
  created_at
FROM all_leads
WHERE brand = 'windchasers'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Count how many leads have windchasers data
SELECT 
  COUNT(*) as total_leads,
  COUNT(unified_context->'windchasers') as leads_with_windchasers,
  COUNT(unified_context->'windchasers'->>'user_type') as leads_with_user_type,
  COUNT(unified_context->'windchasers'->>'course_interest') as leads_with_course_interest,
  COUNT(unified_context->'windchasers'->>'plan_to_fly') as leads_with_timeline
FROM all_leads
WHERE brand = 'windchasers';

-- 3. Check a specific lead's full unified_context structure
-- Replace 'YOUR_LEAD_ID' with an actual lead ID from above
/*
SELECT 
  id,
  customer_name,
  unified_context,
  jsonb_pretty(unified_context) as formatted_context
FROM all_leads
WHERE id = 'YOUR_LEAD_ID';
*/
