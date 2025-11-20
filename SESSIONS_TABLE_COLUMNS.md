# Supabase `sessions` Table - Complete Column Reference

## All Columns in the `sessions` Table

Based on the TypeScript types and database migrations, here are all the columns in the `sessions` table:

### Primary Key
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NOT NULL | Primary key (auto-generated) |

### Session Identification
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `external_session_id` | TEXT | NOT NULL | External session identifier from the source system (e.g., Web PROXe, WhatsApp) |

### User Information
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `user_name` | TEXT | NULL | User's full name |
| `email` | TEXT | NULL | User's email address |
| `phone` | TEXT | NULL | User's phone number |

### Channel Information
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `channel` | ENUM | NOT NULL | Source channel: `'web'`, `'whatsapp'`, `'voice'`, or `'social'` |
| `channel_data` | JSONB | NULL | Channel-specific data stored as JSON:
| | | | - For `web`: `{ chat_session_id, ...metadata }` |
| | | | - For `whatsapp`: `{ whatsapp_id, message, ...metadata }` |
| | | | - For `voice`: `{ voice_id, ...metadata }` |
| | | | - For `social`: `{ social_id, ...metadata }` |

### Status & Booking Information
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `status` | TEXT | NULL | Custom lead status (added in migration 005):
| | | | - `'New Lead'` (default)
| | | | - `'Follow Up'`
| | | | - `'RNR (No Response)'`
| | | | - `'Interested'`
| | | | - `'Wrong Enquiry'`
| | | | - `'Call Booked'`
| | | | - `'Closed'` |
| `booking_status` | ENUM | NULL | Booking status: `'pending'`, `'confirmed'`, or `'cancelled'` |
| `booking_date` | DATE | NULL | Scheduled booking date |
| `booking_time` | TIME | NULL | Scheduled booking time |
| `booking_created_at` | TIMESTAMP | NULL | Timestamp when booking was created |
| `google_event_id` | TEXT | NULL | Google Calendar event ID (if booking was synced) |

### Conversation Data
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `conversation_summary` | TEXT | NULL | AI-generated summary of the conversation |
| `user_inputs_summary` | JSONB | NULL | Summary of user inputs/interactions |
| `message_count` | INTEGER | NULL | Total number of messages in the session |
| `last_message_at` | TIMESTAMP | NULL | Timestamp of the last message |

### Website & Brand Information
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `website_url` | TEXT | NULL | Website URL where the session originated |
| `brand` | ENUM | NULL | Brand identifier: `'proxe'` or `'windchasers'` |

### Timestamps
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | NULL | When the session record was created (default: NOW()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NULL | When the session record was last updated (default: NOW()) |

## Complete Column List (Alphabetical)

1. `booking_created_at` - TIMESTAMP
2. `booking_date` - DATE
3. `booking_status` - ENUM ('pending', 'confirmed', 'cancelled')
4. `booking_time` - TIME
5. `brand` - ENUM ('proxe', 'windchasers')
6. `channel` - ENUM ('web', 'whatsapp', 'voice', 'social')
7. `channel_data` - JSONB
8. `conversation_summary` - TEXT
9. `created_at` - TIMESTAMP WITH TIME ZONE
10. `email` - TEXT
11. `external_session_id` - TEXT
12. `google_event_id` - TEXT
13. `id` - UUID (Primary Key)
14. `last_message_at` - TIMESTAMP
15. `message_count` - INTEGER
16. `phone` - TEXT
17. `status` - TEXT (with CHECK constraint)
18. `updated_at` - TIMESTAMP WITH TIME ZONE
19. `user_inputs_summary` - JSONB
20. `user_name` - TEXT
21. `website_url` - TEXT

## Column Count
**Total: 21 columns**

## Required vs Optional Fields

### Required Fields (NOT NULL)
- `id` (auto-generated)
- `external_session_id`
- `channel`

### Optional Fields (NULL allowed)
All other fields are nullable, meaning they can be `NULL`.

## Default Values

- `status`: Defaults to `'New Lead'` (if not set, or set based on `booking_status`)
- `created_at`: Defaults to `NOW()`
- `updated_at`: Defaults to `NOW()`
- `message_count`: No default (can be NULL)

## Constraints

### CHECK Constraints
1. **`status`**: Must be one of:
   - `'New Lead'`
   - `'Follow Up'`
   - `'RNR (No Response)'`
   - `'Interested'`
   - `'Wrong Enquiry'`
   - `'Call Booked'`
   - `'Closed'`

2. **`booking_status`**: Must be one of:
   - `'pending'`
   - `'confirmed'`
   - `'cancelled'`

3. **`channel`**: Must be one of:
   - `'web'`
   - `'whatsapp'`
   - `'voice'`
   - `'social'`

4. **`brand`**: Must be one of:
   - `'proxe'`
   - `'windchasers'`

## Indexes

The following indexes exist on the `sessions` table (from migrations):

1. `sessions_channel_idx` - Index on `channel` column
2. `sessions_created_at_idx` - Index on `created_at` column
3. `sessions_brand_idx` - Index on `brand` column
4. `sessions_booking_date_idx` - Index on `booking_date` column (partial, WHERE booking_date IS NOT NULL)
5. `idx_sessions_status` - Index on `status` column

## Row Level Security (RLS)

- **RLS Enabled**: Yes
- **Policies**:
  - **SELECT**: Authenticated users can view all sessions
  - **UPDATE**: Authenticated users can update sessions (specifically the `status` column)

## Example Row

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "external_session_id": "web_1234567890_abc123",
  "user_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "website_url": "https://example.com",
  "conversation_summary": "User inquired about product features",
  "last_message_at": "2024-01-15T14:30:00Z",
  "user_inputs_summary": {
    "questions": ["What is the price?", "Do you offer support?"],
    "interests": ["pricing", "support"]
  },
  "message_count": 15,
  "booking_date": "2024-01-20",
  "booking_time": "14:30:00",
  "booking_status": "confirmed",
  "google_event_id": "event_xyz123",
  "booking_created_at": "2024-01-15T14:35:00Z",
  "brand": "proxe",
  "channel": "web",
  "channel_data": {
    "chat_session_id": "chat_xyz789",
    "user_agent": "Mozilla/5.0...",
    "referrer": "https://google.com"
  },
  "status": "Call Booked",
  "created_at": "2024-01-15T14:00:00Z",
  "updated_at": "2024-01-15T14:35:00Z"
}
```

## Notes

- The `status` column was added in migration `005_add_status_column.sql`
- The `status` column has a default value of `'New Lead'` but can be automatically set to `'Call Booked'` if `booking_status = 'confirmed'`
- The `channel_data` JSONB column is flexible and can store different structures depending on the channel
- All timestamp columns use `TIMESTAMP WITH TIME ZONE` for proper timezone handling

