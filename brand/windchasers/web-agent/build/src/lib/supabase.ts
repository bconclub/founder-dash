import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const clientCache: SupabaseClient | null = null;

const windchasersSupabaseUrl = process.env.NEXT_PUBLIC_WINDCHASERS_SUPABASE_URL ?? process.env.WINDCHASERS_SUPABASE_URL;
const windchasersSupabaseAnonKey = process.env.NEXT_PUBLIC_WINDCHASERS_SUPABASE_ANON_KEY ?? process.env.WINDCHASERS_SUPABASE_ANON_KEY;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientCache) {
    return clientCache;
  }

  if (!windchasersSupabaseUrl || !windchasersSupabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Supabase Windchasers] Missing Supabase URL or anon key.', {
        url: windchasersSupabaseUrl,
        anonKeyPresent: Boolean(windchasersSupabaseAnonKey),
        envVars: {
          NEXT_PUBLIC_WINDCHASERS_SUPABASE_URL: process.env.NEXT_PUBLIC_WINDCHASERS_SUPABASE_URL ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_WINDCHASERS_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_WINDCHASERS_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
          WINDCHASERS_SUPABASE_URL: process.env.WINDCHASERS_SUPABASE_URL ? 'SET' : 'NOT SET',
          WINDCHASERS_SUPABASE_ANON_KEY: process.env.WINDCHASERS_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        }
      });
    }
    return null;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Supabase Windchasers] Creating client', {
      url: windchasersSupabaseUrl.replace(/(https?:\/\/)|\..*/g, '$1***'),
    });
  }

  const client = createClient(windchasersSupabaseUrl, windchasersSupabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}

// Service role client for server-side operations
export function getSupabaseServiceClient(): SupabaseClient | null {
  // Check both possible environment variable names
  const serviceKey = process.env.WINDCHASERS_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!windchasersSupabaseUrl || !serviceKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Supabase Windchasers Service] Missing Supabase URL or service key.', {
        hasUrl: !!windchasersSupabaseUrl,
        hasServiceKey: !!serviceKey,
        envVars: {
          WINDCHASERS_SUPABASE_SERVICE_KEY: process.env.WINDCHASERS_SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
        }
      });
    }
    return null;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Supabase Windchasers Service] Creating service role client', {
      url: windchasersSupabaseUrl.replace(/(https?:\/\/)|\..*/g, '$1***'),
      hasServiceKey: !!serviceKey,
    });
  }

  return createClient(windchasersSupabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}
