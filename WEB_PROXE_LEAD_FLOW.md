# Web PROXe Lead Flow Documentation

## Overview
This document explains how leads from Web PROXe are processed, stored, and displayed in the dashboard using the multi-touchpoint schema.

## Flow Diagram

```
Web PROXe System
    ↓
POST /api/integrations/web-agent
    ↓
Normalize phone number
    ↓
Check all_leads (by phone + brand)
    ↓
[New Lead] → Create all_leads (first_touchpoint='web')
[Existing] → Update all_leads (last_touchpoint='web')
    ↓
Create web_sessions (full customer data)
    ↓
Insert into messages table (audit trail)
    ↓
unified_leads view (for dashboard display)
    ↓
Dashboard UI
```

## 1. Entry Point: Webhook API

**File**: `src/app/api/integrations/web-agent/route.ts`

**Endpoint**: `POST /api/integrations/web-agent`

### Authentication
- Uses service role key (bypasses RLS, no auth required for webhooks)
- Allows external systems to post leads without user authentication

### Request Body (Expected Fields)
```json
{
  "name": "User Name",                    // Required
  "phone": "+1234567890",                 // Required
  "email": "user@example.com",            // Optional
  "brand": "proxe",                       // Optional, defaults to 'proxe'
  "booking_status": "pending" | "confirmed" | "cancelled",
  "booking_date": "2024-01-15",
  "booking_time": "14:30:00",
  "external_session_id": "optional_external_id",
  "chat_session_id": "optional_chat_session_id",
  "website_url": "https://example.com",
  "conversation_summary": "AI-generated summary",
  "user_inputs_summary": {},
  "message_count": 15,
  "last_message_at": "2024-01-15T14:30:00Z",
  "metadata": {
    // Additional channel-specific data
  }
}
```

### Processing Logic

1. **Validate Required Fields**: 
   - Checks for `name` and `phone` (required)
   - Returns 400 error if missing

2. **Normalize Phone Number**:
   - Removes all non-digit characters using `normalizePhone()`
   - Example: `"+91 98765-43210"` → `"919876543210"`

3. **Check for Existing Lead**:
   - Queries `all_leads` by `(customer_phone_normalized, brand)`
   - If found: Update `last_touchpoint='web'` and `last_interaction_at`
   - If not found: Create new `all_leads` with `first_touchpoint='web'`

4. **Generate Session ID**: 
   - Uses `external_session_id` if provided
   - Falls back to `chat_session_id`
   - If neither provided, generates: `web_{timestamp}_{random}`

5. **Create Web Session**:
   - Inserts into `web_sessions` table with full customer data
   - Links to `all_leads` via `lead_id` foreign key

6. **Insert Message**:
   - Creates audit trail entry in `messages` table
   - Sets `channel='web'`, `sender='system'`

## 2. Database Tables

### Primary Table: `all_leads`

**Purpose**: Minimal unifier table - one record per customer across all channels

**Key Columns**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `customer_name` | TEXT | Customer's name |
| `email` | TEXT | Customer's email |
| `phone` | TEXT | Customer's phone (original format) |
| `customer_phone_normalized` | TEXT | Normalized phone (digits only) - used for deduplication |
| `first_touchpoint` | ENUM | Channel where customer first interacted: `'web'`, `'whatsapp'`, `'voice'`, `'social'` |
| `last_touchpoint` | ENUM | Most recent channel: `'web'`, `'whatsapp'`, `'voice'`, `'social'` |
| `last_interaction_at` | TIMESTAMP | Timestamp of most recent interaction |
| `brand` | ENUM | `'proxe'` or `'windchasers'` |
| `unified_context` | JSONB | Aggregated context from all channels |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | When record was last updated |

**Deduplication Key**: `(customer_phone_normalized, brand)` - ensures one lead per phone number per brand

### Web Sessions Table: `web_sessions`

**Purpose**: Self-contained table storing all Web PROXe session data

**Key Columns for Web PROXe**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `lead_id` | UUID | Foreign key to `all_leads.id` |
| `brand` | ENUM | `'proxe'` or `'windchasers'` |
| `customer_name` | TEXT | Customer's name |
| `customer_email` | TEXT | Customer's email |
| `customer_phone` | TEXT | Customer's phone (original format) |
| `customer_phone_normalized` | TEXT | Normalized phone for deduplication |
| `external_session_id` | TEXT | External session identifier from Web PROXe |
| `chat_session_id` | TEXT | Original chat session ID |
| `website_url` | TEXT | Website URL where session originated |
| `booking_status` | ENUM | `'pending'`, `'confirmed'`, or `'cancelled'` |
| `booking_date` | DATE | Scheduled booking date |
| `booking_time` | TIME | Scheduled booking time |
| `google_event_id` | TEXT | Google Calendar event ID (if booked) |
| `booking_created_at` | TIMESTAMP | When booking was created |
| `conversation_summary` | TEXT | AI-generated summary of conversation |
| `user_inputs_summary` | JSONB | Summary of user inputs/interactions |
| `message_count` | INTEGER | Number of messages in session |
| `last_message_at` | TIMESTAMP | Timestamp of last message |
| `session_status` | TEXT | `'active'`, `'completed'`, or `'abandoned'` |
| `channel_data` | JSONB | Additional channel-specific metadata |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | When record was last updated |

**Note**: This table is self-contained - all Web PROXe data is stored here. No joins needed if customer only uses Web channel.

### Messages Table: `messages`

**Purpose**: Universal message log - append-only audit trail for all channels

**Key Columns**:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `lead_id` | UUID | Foreign key to `all_leads.id` |
| `channel` | ENUM | `'web'`, `'whatsapp'`, `'voice'`, `'social'` |
| `sender` | ENUM | `'customer'`, `'agent'`, or `'system'` |
| `content` | TEXT | Message content |
| `message_type` | TEXT | `'text'`, `'image'`, `'audio'`, etc. |
| `metadata` | JSONB | Additional message metadata |
| `created_at` | TIMESTAMP | When message was created |

**Note**: Every interaction creates a message entry. Used for building context windows and conversation history.

## 3. Unified Leads View

**File**: `supabase/migrations/007_rename_sessions_to_all_leads.sql`

**Purpose**: Provides a unified view of all leads from all channels for dashboard display

### View Definition

The `unified_leads` view queries from `all_leads` and joins with channel-specific tables to aggregate data:

```sql
CREATE OR REPLACE VIEW unified_leads AS
SELECT 
  al.id,
  al.customer_name AS name,
  al.email,
  al.phone,
  al.first_touchpoint,
  al.last_touchpoint,
  al.brand,
  al.created_at AS timestamp,
  al.last_interaction_at,
  -- Aggregate metadata from all channels
  jsonb_build_object(
    'web', (SELECT row_to_json(ws.*) FROM web_sessions ws WHERE ws.lead_id = al.id LIMIT 1),
    'whatsapp', (SELECT row_to_json(ws.*) FROM whatsapp_sessions ws WHERE ws.lead_id = al.id LIMIT 1),
    'voice', (SELECT row_to_json(vs.*) FROM voice_sessions vs WHERE vs.lead_id = al.id LIMIT 1),
    'social', (SELECT row_to_json(ss.*) FROM social_sessions ss WHERE ss.lead_id = al.id LIMIT 1),
    'unified_context', al.unified_context
  ) AS metadata
FROM all_leads al
WHERE (
  al.customer_name IS NOT NULL 
  OR al.email IS NOT NULL 
  OR al.phone IS NOT NULL
);
```

### Key Mappings

- **name**: Maps from `all_leads.customer_name`
- **first_touchpoint**: Shows which channel the customer first used (e.g., `'web'`)
- **last_touchpoint**: Shows most recent channel (e.g., `'web'`)
- **metadata**: Contains data from all channel tables the customer has interacted with
  - For Web-only customers: `metadata.web` contains full `web_sessions` data
  - For multi-channel customers: `metadata` contains data from all channels

## 4. Dashboard Display

### API Endpoint: GET /api/integrations/web-agent

**File**: `src/app/api/integrations/web-agent/route.ts` (GET handler)

**Process**:
1. Fetches from `unified_leads` view
2. Filters/orders by `timestamp` (descending)
3. Limits to 100 records
4. Maps to dashboard format

### Dashboard Components

**Main Dashboard**: `src/app/dashboard/page.tsx`
- Displays channel cards including "Web PROXe"
- Links to `/dashboard/channels/web`

**Web Channel Page**: `src/app/dashboard/channels/web/page.tsx`
- Shows Web PROXe specific metrics and leads

**Leads Table**: `src/components/dashboard/LeadsTable.tsx`
- Displays all leads from `unified_leads` view
- Filters by source = 'web' for Web PROXe leads

## 5. Real-time Updates

**File**: `src/hooks/useRealtimeLeads.ts`

**Process**:
- Subscribes to Supabase Realtime changes on `all_leads` table
- Filters for `first_touchpoint = 'web'` or `last_touchpoint = 'web'`
- Maps lead data to Lead format:
  ```typescript
  {
    id: lead.id,
    name: lead.customer_name,
    email: lead.email,
    phone: lead.phone,
    source: lead.first_touchpoint,  // 'web'
    timestamp: lead.created_at,
    first_touchpoint: lead.first_touchpoint,
    last_touchpoint: lead.last_touchpoint,
    metadata: lead.metadata  // Contains web_sessions data
  }
  ```

## 6. Data Flow Summary

### Creating a Web PROXe Lead

1. **Web PROXe System** sends POST request to `/api/integrations/web-agent`
2. **API Handler** validates required fields (`name`, `phone`)
3. **Phone Normalization**: Normalizes phone number (removes non-digits)
4. **Lead Detection**: 
   - Queries `all_leads` by `(customer_phone_normalized, brand)`
   - If new: Creates `all_leads` with `first_touchpoint='web'`, `last_touchpoint='web'`
   - If existing: Updates `all_leads` with `last_touchpoint='web'`, `last_interaction_at`
5. **Web Session Creation**:
   - Inserts into `web_sessions` table with full customer data
   - Links to `all_leads` via `lead_id`
6. **Message Log**: Inserts into `messages` table for audit trail
7. **View Update**: `unified_leads` view automatically includes the new record
8. **Real-time Notification**: Supabase Realtime broadcasts the change
9. **Dashboard Update**: Frontend receives real-time update and refreshes

### Querying Web PROXe Leads

1. **Dashboard Request**: Frontend calls `/api/dashboard/leads` or `/api/integrations/web-agent`
2. **Database Query**: Queries `unified_leads` view with `source = 'web'`
3. **Data Mapping**: Maps view columns to Lead interface
4. **Response**: Returns JSON array of leads

## 7. Key Details Stored for Web PROXe Leads

### Required Fields
- `name`: Customer's name
- `phone`: Customer's phone number (will be normalized)

### Optional but Common Fields
- `email`: Customer's email
- `brand`: `'proxe'` or `'windchasers'` (defaults to `'proxe'`)
- `booking_status`: `'pending'`, `'confirmed'`, or `'cancelled'`
- `booking_date`: Scheduled date
- `booking_time`: Scheduled time
- `external_session_id`: External session identifier
- `chat_session_id`: Original chat session ID from Web PROXe
- `website_url`: Website where session originated
- `conversation_summary`: AI-generated summary
- `user_inputs_summary`: Summary of user inputs (JSONB)
- `message_count`: Number of messages
- `last_message_at`: Last message timestamp
- `metadata`: Additional channel-specific data (JSONB)

## 8. Security & Access Control

### Row Level Security (RLS)
- `all_leads` table: Authenticated users can view all leads
- `web_sessions` table: Authenticated users can view all web sessions
- `messages` table: Authenticated users can view all messages
- `unified_leads` view: Authenticated users can view all leads

### API Authentication
- POST endpoint: Uses service role key (bypasses RLS, allows external webhooks)
- GET endpoint: Requires authenticated Supabase user (for dashboard access)

## 9. Indexes for Performance

The `all_leads` table has indexes on:
- `customer_phone_normalized` + `brand` (for lead deduplication)
- `first_touchpoint` (for filtering by origin channel)
- `last_touchpoint` (for filtering by recent channel)
- `created_at` (for sorting by timestamp)
- `brand` (for filtering by brand)

The `web_sessions` table has indexes on:
- `lead_id` (for joining with all_leads)
- `booking_date` (for filtering bookings)
- `created_at` (for sorting)

## 10. Example Webhook Payload

```json
{
  "external_session_id": "web_1234567890_abc123",
  "chat_session_id": "chat_xyz789",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "booking_status": "confirmed",
  "booking_date": "2024-01-15",
  "booking_time": "14:30:00",
  "metadata": {
    "website_url": "https://example.com",
    "conversation_topic": "Product inquiry",
    "user_agent": "Mozilla/5.0..."
  }
}
```

This creates:
1. **all_leads** record with:
   - `first_touchpoint = 'web'`
   - `last_touchpoint = 'web'`
   - `customer_phone_normalized = '1234567890'` (normalized)
2. **web_sessions** record with:
   - Full customer data
   - `booking_status = 'confirmed'`
   - `session_status = 'active'`
   - `channel_data` contains the metadata object
3. **messages** record with:
   - `channel = 'web'`
   - `sender = 'system'`
   - Content: "Web inquiry from John Doe"

