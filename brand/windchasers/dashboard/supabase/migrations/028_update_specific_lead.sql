-- Update the specific lead with windchasers test data
-- Lead ID: c5338c60-5aac-4555-bf2f-e949ee776aca

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
WHERE id = 'c5338c60-5aac-4555-bf2f-e949ee776aca'
RETURNING 
  id, 
  customer_name, 
  email,
  phone,
  unified_context->'windchasers' as windchasers_data,
  unified_context->'windchasers'->>'user_type' as user_type,
  unified_context->'windchasers'->>'course_interest' as course_interest,
  unified_context->'windchasers'->>'plan_to_fly' as plan_to_fly;

-- Verify the update worked
SELECT 
  id,
  customer_name,
  email,
  phone,
  unified_context->'windchasers' as windchasers_data,
  unified_context->'windchasers'->>'user_type' as user_type,
  unified_context->'windchasers'->>'course_interest' as course_interest,
  unified_context->'windchasers'->>'plan_to_fly' as plan_to_fly,
  unified_context->'windchasers'->>'timeline' as timeline
FROM all_leads
WHERE id = 'c5338c60-5aac-4555-bf2f-e949ee776aca';
