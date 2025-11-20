# PROXe Multi-Touchpoint Schema - Complete Summary

## What You Have

### 1. Migration File
**File**: `001_rename_sessions_to_all_leads.sql`

Renames `sessions` → `all_leads` and creates the complete multi-channel schema.

**Tables Created**:
- ✅ `all_leads` — Master customer record (minimal, unifier only)
- ✅ `web_sessions` — Self-contained Web PROXe data
- ✅ `whatsapp_sessions` — Self-contained WhatsApp data
- ✅ `voice_sessions` — Self-contained Voice data
- ✅ `social_sessions` — Self-contained Social data
- ✅ `messages` — Universal message log (all channels)
- ✅ `unified_leads` — Read-only view for dashboard

---

## Core Architecture

### Each Channel is Independent + Connectable

```
Customer enters via ANY channel first
                    ↓
             Create all_leads (set first_touchpoint)
                    ↓
        Create channel session table (full customer data)
                    ↓
           Insert into messages table
                    ↓
Customer uses another channel later
                    ↓
        Find existing all_leads by (phone_normalized)
                    ↓
        Create new channel session (linked via lead_id)
                    ↓
        Update all_leads (last_touchpoint)
                    ↓
           Insert into messages table
                    ↓
      unified_leads shows complete journey
```

---

## Table Summary

### `all_leads` (7 KB reference table)
```sql
-- Minimal unifier
id | customer_name | email | phone | customer_phone_normalized
first_touchpoint ('web'|'whatsapp'|'voice'|'social')
last_touchpoint  ('web'|'whatsapp'|'voice'|'social')
last_interaction_at | unified_context | created_at | updated_at
```

**Purpose**: One record per customer. Shows which channel they came from.

---

### `web_sessions` (Self-contained)
```sql
id | lead_id | brand | customer_name | customer_email | customer_phone
external_session_id | chat_session_id | website_url
booking_status | booking_date | booking_time | google_event_id
conversation_summary | user_inputs_summary | message_count | last_message_at
session_status | channel_data | created_at | updated_at
```

**Works alone**: Customer only uses Web → all data here. No joins needed.

---

### `whatsapp_sessions` (Self-contained)
```sql
id | lead_id | brand | customer_name | customer_email | customer_phone
customer_phone_normalized | whatsapp_business_account_id | whatsapp_contact_id
conversation_summary | conversation_context | user_inputs_summary
message_count | last_message_at | last_message_from | last_message_preview
conversation_status | response_time_avg_seconds | overall_sentiment
channel_data | created_at | updated_at
```

**Works alone**: Customer only uses WhatsApp → all data here. No joins needed.

---

### `voice_sessions` (Self-contained)
```sql
id | lead_id | brand | customer_name | customer_email | customer_phone
customer_phone_normalized | call_sid | phone_number
call_duration_seconds | call_status | call_direction
recording_url | transcription | call_summary
sentiment | conversation_context | user_inputs_summary | audio_quality
channel_data | created_at | updated_at
```

**Works alone**: Customer only calls → all data here. No joins needed.

---

### `social_sessions` (Self-contained)
```sql
id | lead_id | brand | customer_name | customer_email | customer_phone
customer_phone_normalized | platform | platform_user_id | platform_username
engagement_type | content_id | engagement_preview | last_engagement_at
engagement_count | conversation_summary | conversation_context | user_inputs_summary
sentiment | engagement_quality | channel_data | created_at | updated_at
```

**Works alone**: Customer only engages on social → all data here. No joins needed.

---

### `messages` (Universal log)
```sql
id | lead_id | channel ('web'|'whatsapp'|'voice'|'social')
sender ('customer'|'agent'|'system') | content | message_type
metadata (JSONB: sentiment, intent, model_used, tokens_used, etc.) | created_at
```

**Purpose**: Append-only audit trail. Every interaction = one row. Used for context window building.

---

### `unified_leads` View (Read-only)
```
id | first_touchpoint | last_touchpoint | name | email | phone | brand
timestamp | metadata (JSONB) | last_interaction_at | unified_context
```

**Purpose**: Dashboard display. Shows customer + all their channel data in one row.

---

## Implementation Checklist

### ✅ Migration
- [ ] Run `001_rename_sessions_to_all_leads.sql` on Supabase
- [ ] Verify all tables created
- [ ] Check indexes created
- [ ] Verify RLS policies applied

### ✅ Web PROXe Updates
- [ ] Webhook now sends: brand, customer_phone_normalized
- [ ] Creates all_leads with first_touchpoint='web'
- [ ] Creates web_sessions with full customer data
- [ ] Inserts into messages table

### ✅ n8n WhatsApp Setup
- [ ] Listen for WhatsApp webhooks (phone, message, brand)
- [ ] Normalize phone number
- [ ] Query all_leads by (phone_normalized, brand)
- [ ] If new → Create all_leads (first_touchpoint='whatsapp')
- [ ] Create/Update whatsapp_sessions
- [ ] Insert into messages table
- [ ] Send response back via WhatsApp

### ✅ Voice Setup (Future)
- [ ] Listen for call webhooks (phone, call_sid, brand)
- [ ] Same lead detection logic
- [ ] Create/Update voice_sessions
- [ ] After call ends: transcription → voice_sessions
- [ ] Insert messages

### ✅ Social Setup (Future)
- [ ] Listen for platform webhooks (username/DM, phone, brand)
- [ ] Create/Update social_sessions
- [ ] Insert messages

### ✅ Dashboard Updates
- [ ] Query unified_leads view
- [ ] Display first_touchpoint (shows origin channel)
- [ ] Display metadata (shows data from each channel)
- [ ] Show customer journey (Web → WhatsApp → Voice, etc.)

---

## Key Data Flows

### Scenario 1: WhatsApp-only customer
```
1. WhatsApp webhook: phone=+919876543210, name=John, brand=proxe
2. Create all_leads: first_touchpoint='whatsapp'
3. Create whatsapp_sessions: (all customer data)
4. Insert messages: (message + sentiment + intent)
5. Dashboard: Shows "Started on WhatsApp" customer
   → All data in whatsapp_sessions (no joins)
```

### Scenario 2: Web first, then WhatsApp
```
1. Web webhook: phone=+919876543210, name=John, brand=proxe
2. Create all_leads: first_touchpoint='web'
3. Create web_sessions: (booking data)
4. Insert messages: (chat transcript)
5. Later: WhatsApp from same phone
6. Query all_leads: Found! lead_id=lead-123
7. Create whatsapp_sessions: (linked to lead-123)
8. Update all_leads: last_touchpoint='whatsapp'
9. Insert messages: (WhatsApp transcript)
10. Dashboard: Shows "Started on Web, now on WhatsApp" customer
    → Both tables linked via lead_id
    → Messages table has full journey
```

### Scenario 3: Voice first, add Web & WhatsApp
```
1. Incoming call: phone=+919876543210, brand=proxe
2. Create all_leads: first_touchpoint='voice'
3. Create voice_sessions: (call recording, transcript)
4. Customer later fills Web form (same phone)
5. Find all_leads: first_touchpoint still='voice'
6. Create web_sessions: (linked to same lead)
7. Update last_touchpoint='web'
8. Customer then messages on WhatsApp
9. Find all_leads: first_touchpoint still='voice'
10. Create whatsapp_sessions: (linked to same lead)
11. Update last_touchpoint='whatsapp'
12. unified_leads shows:
    - first_touchpoint='voice' (origin)
    - last_touchpoint='whatsapp' (most recent)
    - metadata includes all 3 channels
```

---

## Query Examples

### Find a customer (works with any channel)
```sql
-- By phone across any channel
SELECT * FROM unified_leads 
WHERE phone='919876543210';

-- Shows: first_touchpoint, last_touchpoint, data from all channels
```

### Get customer conversation history
```sql
SELECT channel, sender, content, created_at
FROM messages
WHERE lead_id='lead-123'
ORDER BY created_at ASC;
-- Full chat history: Web → WhatsApp → Voice, etc.
```

### Dashboard: Customers by first touchpoint
```sql
SELECT 
  CASE first_touchpoint
    WHEN 'web' THEN '🌐 Web'
    WHEN 'whatsapp' THEN '💬 WhatsApp'
    WHEN 'voice' THEN '☎️ Voice'
    WHEN 'social' THEN '📱 Social'
  END AS channel,
  COUNT(*) AS count
FROM unified_leads
WHERE brand='proxe'
GROUP BY first_touchpoint;
```

### Find customers who started Web but converted via WhatsApp
```sql
SELECT name, email, first_touchpoint, last_touchpoint
FROM unified_leads
WHERE first_touchpoint='web'
AND last_touchpoint='whatsapp'
AND brand='proxe';
```

---

## Next Steps

1. **Deploy migration**: `001_rename_sessions_to_all_leads.sql` to Supabase
2. **Update Web webhook**: Add brand, customer_phone_normalized to POST body
3. **Build n8n workflow**: WhatsApp listening + Supabase integration
4. **Test with sample data**: Create leads from different channels, verify deduplication
5. **Update dashboard**: Query unified_leads, display first_touchpoint
6. **Build orchestrator**: Query messages + unified_leads for context, send responses

---

## Files You Have

1. **`001_rename_sessions_to_all_leads.sql`** — Migration file (run on Supabase)
2. **`SCHEMA_DOCUMENTATION.md`** — Detailed table documentation
3. **`CHANNEL_SCHEMA_DETAILED.md`** — Full field-by-field reference
4. **`INDEPENDENT_CHANNELS.md`** — Architecture & philosophy
5. **`FIRST_TOUCHPOINT_GUIDE.md`** — How to set & use first_touchpoint
6. **`BRAND_MANAGEMENT.md`** — (Older, reference only, architecture changed)

---

## Support Notes

- **Deduplication key**: `(customer_phone_normalized, brand)`
- **Immutable field**: `first_touchpoint` — Never changes after creation
- **Always normalize phone**: Use `normalize_phone()` function (removes all non-digits)
- **Messages are append-only**: Never update, only insert
- **Each session is self-sufficient**: No joins required if customer only uses one channel
- **all_leads is the unifier**: Links multiple channels together

---

## Ready to Deploy

The migration is ready. Review the files, then:

```bash
# 1. Copy 001_rename_sessions_to_all_leads.sql to Supabase SQL editor
# 2. Run the migration
# 3. Verify tables created
# 4. Update Web PROXe webhook
# 5. Build n8n WhatsApp flow
# 6. Test with sample data
```

Let me know when you're ready for the next step!
