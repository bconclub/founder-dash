# Fix 502 Bad Gateway Error

The 502 error is likely because the `unified_leads` view doesn't have all the columns the application expects.

## Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Update unified_leads view to match the new schema
DROP VIEW IF EXISTS unified_leads;

CREATE OR REPLACE VIEW unified_leads AS
SELECT 
  al.id,
  al.first_touchpoint,
  al.last_touchpoint,
  al.customer_name AS name,
  al.email,
  al.phone,
  al.brand,
  al.created_at AS timestamp,
  al.last_interaction_at,
  -- Status from web_sessions booking_status (most common)
  COALESCE(
    (SELECT ws.booking_status FROM web_sessions ws WHERE ws.lead_id = al.id ORDER BY ws.created_at DESC LIMIT 1),
    'new'
  ) AS status,
  -- Booking date/time from web_sessions
  (SELECT ws.booking_date FROM web_sessions ws WHERE ws.lead_id = al.id ORDER BY ws.created_at DESC LIMIT 1) AS booking_date,
  (SELECT ws.booking_time FROM web_sessions ws WHERE ws.lead_id = al.id ORDER BY ws.created_at DESC LIMIT 1) AS booking_time,
  -- Metadata with all channel data
  JSONB_BUILD_OBJECT(
    'web_data', (
      SELECT JSONB_BUILD_OBJECT(
        'customer_name', ws.customer_name,
        'booking_status', ws.booking_status,
        'booking_date', ws.booking_date,
        'booking_time', ws.booking_time,
        'conversation_summary', ws.conversation_summary,
        'message_count', ws.message_count,
        'last_message_at', ws.last_message_at,
        'session_status', ws.session_status,
        'website_url', ws.website_url
      )
      FROM web_sessions ws WHERE ws.lead_id = al.id ORDER BY ws.created_at DESC LIMIT 1
    ),
    'whatsapp_data', (
      SELECT JSONB_BUILD_OBJECT(
        'message_count', whs.message_count,
        'last_message_at', whs.last_message_at,
        'conversation_status', whs.conversation_status,
        'overall_sentiment', whs.overall_sentiment
      )
      FROM whatsapp_sessions whs WHERE whs.lead_id = al.id ORDER BY whs.created_at DESC LIMIT 1
    ),
    'voice_data', (
      SELECT JSONB_BUILD_OBJECT(
        'call_duration', vs.call_duration_seconds,
        'call_status', vs.call_status,
        'sentiment', vs.sentiment
      )
      FROM voice_sessions vs WHERE vs.lead_id = al.id ORDER BY vs.created_at DESC LIMIT 1
    ),
    'social_data', (
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT('platform', ss.platform, 'engagement_type', ss.engagement_type))
      FROM social_sessions ss WHERE ss.lead_id = al.id
    )
  ) AS metadata,
  al.unified_context
FROM all_leads al
WHERE (
  al.customer_name IS NOT NULL 
  OR al.email IS NOT NULL 
  OR al.phone IS NOT NULL
);

-- Grant access to authenticated users
GRANT SELECT ON unified_leads TO authenticated;
```

## Steps

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Open **SQL Editor** → **New query**
3. Copy and paste the SQL above
4. Click **Run**
5. Wait for success message
6. Refresh your dashboard

## Alternative: Check PM2 Logs

If the error persists, check the application logs on your VPS:

```bash
pm2 logs dashboard --lines 100
```

This will show you the actual error message from the application.

## Common Issues

- **View doesn't exist**: Run the SQL above to create it
- **Missing columns**: The SQL above adds all required columns
- **RLS policies**: Make sure authenticated users have SELECT access (included in SQL)
- **Build errors**: Check GitHub Actions logs for build failures

