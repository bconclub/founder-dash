-- Unified Leads View
-- Combines leads from all sources (dashboard_leads, chat_sessions from web agent, etc.)
-- This provides a single source of truth for the dashboard
-- 
-- NOTE: If chat_sessions table has different column names, you may need to adjust the mapping below
-- Common alternatives: user_name instead of name, user_email instead of email, etc.

CREATE OR REPLACE VIEW unified_leads AS
-- Dashboard leads (primary source)
SELECT 
  id,
  name,
  email,
  phone,
  source,
  created_at AS timestamp,
  status,
  booking_date,
  booking_time,
  source AS lead_type,
  metadata
FROM dashboard_leads
WHERE name IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL;

-- Uncomment and adjust the chat_sessions section below once you verify your column names
-- To include chat_sessions, replace the semicolon above with UNION ALL and uncomment below:
-- 
-- UNION ALL
-- 
-- -- Existing chat_sessions from web agent
-- SELECT 
--   cs.id,
--   COALESCE(cs.name, cs.user_name, cs.full_name) AS name,  -- Adjust based on your actual column name
--   COALESCE(cs.email, cs.user_email) AS email,            -- Adjust based on your actual column name
--   COALESCE(cs.phone, cs.phone_number, cs.mobile) AS phone, -- Adjust based on your actual column name
--   COALESCE(cs.source_channel, cs.channel, 'web') AS source,
--   cs.created_at AS timestamp,
--   cs.status,
--   cs.booking_date,
--   cs.booking_time,
--   'web' AS lead_type,
--   cs.metadata
-- FROM chat_sessions cs
-- WHERE (
--   COALESCE(cs.name, cs.user_name, cs.full_name) IS NOT NULL 
--   OR COALESCE(cs.email, cs.user_email) IS NOT NULL 
--   OR COALESCE(cs.phone, cs.phone_number, cs.mobile) IS NOT NULL
-- );

-- Grant access to authenticated users
GRANT SELECT ON unified_leads TO authenticated;


