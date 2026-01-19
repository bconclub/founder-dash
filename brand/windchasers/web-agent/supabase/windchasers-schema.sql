-- ============================================================================
-- Windchasers Supabase Database Schema
-- Based on PROXe schema with aviation-specific fields
-- Brand: windchasers
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- Create brand enum (if not exists)
DO $$ BEGIN
    CREATE TYPE brand_type AS ENUM ('proxe', 'windchasers');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create channel enum (if not exists)
DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('web', 'whatsapp', 'voice', 'social');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sender enum (if not exists)
DO $$ BEGIN
    CREATE TYPE sender_type AS ENUM ('customer', 'agent', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create booking status enum (if not exists)
DO $$ BEGIN
    CREATE TYPE booking_status_type AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. FUNCTIONS
-- ============================================================================

-- Phone normalization function (extracts last 10 digits)
CREATE OR REPLACE FUNCTION normalize_phone(phone_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone_text IS NULL THEN
        RETURN NULL;
    END IF;
    -- Extract only digits and take last 10 digits
    RETURN RIGHT(REGEXP_REPLACE(phone_text, '[^0-9]', '', 'g'), 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- all_leads - Unified Customer Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS all_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    email TEXT,
    phone TEXT,
    customer_phone_normalized TEXT,
    first_touchpoint channel_type,
    last_touchpoint channel_type,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    brand brand_type NOT NULL CHECK (brand = 'windchasers'),
    unified_context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Deduplication constraint
    CONSTRAINT all_leads_phone_brand_unique UNIQUE (customer_phone_normalized, brand)
);

-- Add aviation-specific fields to unified_context via comment (documentation)
COMMENT ON COLUMN all_leads.unified_context IS 'JSONB structure for Windchasers:
{
  "windchasers": {
    "user_type": "student|parent|professional",
    "city": "string",
    "course_interest": "DGCA|Flight|Heli|Cabin|Drone",
    "training_type": "online|offline|hybrid",
    "class_12_science": boolean,
    "plan_to_fly": "asap|1-3mo|6+mo|1yr+",
    "budget_awareness": "aware|exploring|unaware",
    "dgca_completed": boolean
  }
}';

-- ----------------------------------------------------------------------------
-- web_sessions - Web Agent Session Data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS web_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES all_leads(id) ON DELETE SET NULL,
    brand brand_type NOT NULL CHECK (brand = 'windchasers'),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_phone_normalized TEXT,
    external_session_id TEXT UNIQUE NOT NULL,
    chat_session_id TEXT,
    website_url TEXT,
    booking_status booking_status_type,
    booking_date DATE,
    booking_time TIME,
    google_event_id TEXT,
    booking_created_at TIMESTAMP WITH TIME ZONE,
    conversation_summary TEXT,
    user_inputs_summary JSONB DEFAULT '[]'::jsonb,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    session_status TEXT DEFAULT 'active',
    channel_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- messages - Universal Message Log (conversations table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES all_leads(id) ON DELETE CASCADE,
    channel channel_type NOT NULL,
    sender sender_type NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- all_leads indexes
CREATE INDEX IF NOT EXISTS idx_all_leads_brand ON all_leads(brand);
CREATE INDEX IF NOT EXISTS idx_all_leads_phone_normalized ON all_leads(customer_phone_normalized);
CREATE INDEX IF NOT EXISTS idx_all_leads_email ON all_leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_all_leads_last_interaction ON all_leads(last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_all_leads_unified_context ON all_leads USING GIN(unified_context);

-- web_sessions indexes
CREATE INDEX IF NOT EXISTS idx_web_sessions_brand ON web_sessions(brand);
CREATE INDEX IF NOT EXISTS idx_web_sessions_lead_id ON web_sessions(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_sessions_external_session_id ON web_sessions(external_session_id);
CREATE INDEX IF NOT EXISTS idx_web_sessions_phone_normalized ON web_sessions(customer_phone_normalized) WHERE customer_phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_sessions_email ON web_sessions(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_sessions_booking_status ON web_sessions(booking_status) WHERE booking_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_sessions_last_message_at ON web_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_sessions_created_at ON web_sessions(created_at DESC);

-- messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_lead_channel ON messages(lead_id, channel);
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN(metadata);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_all_leads_updated_at
    BEFORE UPDATE ON all_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web_sessions_updated_at
    BEFORE UPDATE ON web_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-normalize phone numbers on insert/update
CREATE OR REPLACE FUNCTION normalize_all_leads_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.phone IS NOT NULL THEN
        NEW.customer_phone_normalized = normalize_phone(NEW.phone);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_all_leads_phone_trigger
    BEFORE INSERT OR UPDATE OF phone ON all_leads
    FOR EACH ROW
    EXECUTE FUNCTION normalize_all_leads_phone();

CREATE OR REPLACE FUNCTION normalize_web_sessions_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_phone IS NOT NULL THEN
        NEW.customer_phone_normalized = normalize_phone(NEW.customer_phone);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_web_sessions_phone_trigger
    BEFORE INSERT OR UPDATE OF customer_phone ON web_sessions
    FOR EACH ROW
    EXECUTE FUNCTION normalize_web_sessions_phone();

-- ============================================================================
-- 6. VIEWS
-- ============================================================================

-- unified_leads - Dashboard View
CREATE OR REPLACE VIEW unified_leads AS
SELECT 
    al.id,
    al.customer_name AS name,
    al.email,
    al.phone,
    al.first_touchpoint,
    al.last_touchpoint,
    al.brand,
    al.last_interaction_at AS timestamp,
    al.last_interaction_at,
    jsonb_build_object(
        'web', jsonb_build_object(
            'session_id', ws.id,
            'external_session_id', ws.external_session_id,
            'booking_status', ws.booking_status,
            'booking_date', ws.booking_date,
            'booking_time', ws.booking_time,
            'message_count', ws.message_count,
            'last_message_at', ws.last_message_at,
            'session_status', ws.session_status
        ),
        'unified_context', al.unified_context
    ) AS metadata
FROM all_leads al
LEFT JOIN LATERAL (
    SELECT 
        id,
        external_session_id,
        booking_status,
        booking_date,
        booking_time,
        message_count,
        last_message_at,
        session_status
    FROM web_sessions
    WHERE web_sessions.lead_id = al.id
    ORDER BY web_sessions.last_message_at DESC NULLS LAST
    LIMIT 1
) ws ON true
WHERE al.brand = 'windchasers'
ORDER BY al.last_interaction_at DESC NULLS LAST;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE all_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- all_leads RLS Policies
-- Anonymous users: No direct access (created via API with service role)
CREATE POLICY "all_leads_service_role_all" ON all_leads
    FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users: Full access for dashboard
CREATE POLICY "all_leads_authenticated_all" ON all_leads
    FOR ALL
    USING (auth.role() = 'authenticated');

-- web_sessions RLS Policies
-- Anonymous users: Can INSERT, SELECT, UPDATE their own sessions
CREATE POLICY "web_sessions_anon_insert" ON web_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "web_sessions_anon_select" ON web_sessions
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "web_sessions_anon_update" ON web_sessions
    FOR UPDATE
    TO anon
    USING (true);

-- Authenticated users: Full access
CREATE POLICY "web_sessions_authenticated_all" ON web_sessions
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Service role: Full access
CREATE POLICY "web_sessions_service_role_all" ON web_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- messages RLS Policies
-- Anonymous users: No direct access (created via API)
CREATE POLICY "messages_service_role_all" ON messages
    FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users: Full access for dashboard
CREATE POLICY "messages_authenticated_all" ON messages
    FOR ALL
    USING (auth.role() = 'authenticated');

-- unified_leads view RLS
-- Note: Views inherit RLS from underlying tables (all_leads, web_sessions)
-- No direct RLS policies needed on views - access is controlled via base tables

-- ============================================================================
-- 8. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE all_leads IS 'Unified customer table for Windchasers. One record per unique customer across all channels. Deduplication by (customer_phone_normalized, brand).';
COMMENT ON TABLE web_sessions IS 'Web agent session data for Windchasers. Contains chat sessions, bookings, and conversation summaries.';
COMMENT ON TABLE messages IS 'Universal message log for Windchasers. Audit trail of all conversations across channels for Dashboard Inbox.';
COMMENT ON VIEW unified_leads IS 'Dashboard view aggregating all customer data for Windchasers. Used by dashboard for displaying leads with real-time updates.';

COMMENT ON COLUMN all_leads.unified_context IS 'JSONB containing aviation-specific fields:
{
  "windchasers": {
    "user_type": "student|parent|professional",
    "city": "string",
    "course_interest": "DGCA|Flight|Heli|Cabin|Drone",
    "training_type": "online|offline|hybrid",
    "class_12_science": boolean,
    "plan_to_fly": "asap|1-3mo|6+mo|1yr+",
    "budget_awareness": "aware|exploring|unaware",
    "dgca_completed": boolean
  }
}';

-- ============================================================================
-- 9. GRANTS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON web_sessions TO anon;
GRANT SELECT ON unified_leads TO anon;
GRANT ALL ON all_leads, web_sessions, messages TO authenticated;
GRANT SELECT ON unified_leads TO authenticated;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
