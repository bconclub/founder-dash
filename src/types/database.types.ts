export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dashboard_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'viewer'
          created_at: string
          updated_at: string
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'viewer'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'viewer'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
      }
      user_invitations: {
        Row: {
          id: string
          email: string
          token: string
          role: 'admin' | 'viewer'
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          token: string
          role?: 'admin' | 'viewer'
          invited_by?: string | null
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          token?: string
          role?: 'admin' | 'viewer'
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      dashboard_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      dashboard_leads: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          source: 'web' | 'whatsapp' | 'voice' | 'social'
          created_at: string
          status: string | null
          booking_date: string | null
          booking_time: string | null
          metadata: Json | null
          chat_session_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          source: 'web' | 'whatsapp' | 'voice' | 'social'
          created_at?: string
          status?: string | null
          booking_date?: string | null
          booking_time?: string | null
          metadata?: Json | null
          chat_session_id?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          source?: 'web' | 'whatsapp' | 'voice' | 'social'
          created_at?: string
          status?: string | null
          booking_date?: string | null
          booking_time?: string | null
          metadata?: Json | null
          chat_session_id?: string | null
          notes?: string | null
        }
      }
      chat_sessions: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          source_channel: string | null
          created_at: string
          status: string | null
          booking_date: string | null
          booking_time: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          source_channel?: string | null
          created_at?: string
          status?: string | null
          booking_date?: string | null
          booking_time?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          source_channel?: string | null
          created_at?: string
          status?: string | null
          booking_date?: string | null
          booking_time?: string | null
          metadata?: Json | null
        }
      }
      unified_leads: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          source: string | null
          timestamp: string
          status: string | null
          booking_date: string | null
          booking_time: string | null
          lead_type: string
          metadata: Json | null
        }
      }
    }
    Views: {
      unified_leads: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          source: string | null
          timestamp: string
          status: string | null
          booking_date: string | null
          booking_time: string | null
          lead_type: string
          metadata: Json | null
        }
      }
    }
  }
}


