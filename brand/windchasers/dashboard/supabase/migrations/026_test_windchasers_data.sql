-- Test script: Manually add windchasers data to a lead for testing
-- Replace 'YOUR_LEAD_ID' with an actual lead ID from your database

-- First, find a lead ID to test with:
SELECT id, customer_name, email, phone 
FROM all_leads 
WHERE brand = 'windchasers' 
ORDER BY created_at DESC 
LIMIT 5;

-- Then update that lead with test windchasers data:
-- Replace 'YOUR_LEAD_ID' with one of the IDs from above
/*
UPDATE all_leads
SET unified_context = COALESCE(unified_context, '{}'::jsonb) || 
    jsonb_build_object(
      'windchasers',
      jsonb_build_object(
        'user_type', 'student',
        'course_interest', 'pilot',
        'plan_to_fly', 'asap',
        'timeline', 'asap',
        'education', '12th_completed'
      )
    ),
    updated_at = NOW()
WHERE id = 'YOUR_LEAD_ID'
RETURNING id, customer_name, unified_context->'windchasers' as windchasers_data;
*/

-- Or update ALL leads that don't have windchasers data with sample data (for testing):
-- WARNING: This will add test data to all leads without windchasers data
/*
UPDATE all_leads
SET unified_context = COALESCE(unified_context, '{}'::jsonb) || 
    jsonb_build_object(
      'windchasers',
      jsonb_build_object(
        'user_type', 'student',
        'course_interest', 'pilot',
        'plan_to_fly', 'asap',
        'timeline', 'asap'
      )
    ),
    updated_at = NOW()
WHERE brand = 'windchasers'
  AND (unified_context->'windchasers' IS NULL OR unified_context->'windchasers' = '{}'::jsonb)
RETURNING id, customer_name, unified_context->'windchasers' as windchasers_data;
*/
