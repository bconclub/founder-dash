import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Singleton pattern to prevent multiple client instances
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/** Get brand prefix for env var lookup (e.g. "BCON", "WINDCHASERS", "PROXE") */
function brandPrefix(): string {
  return (process.env.NEXT_PUBLIC_BRAND_ID || process.env.NEXT_PUBLIC_BRAND || 'windchasers').toUpperCase()
}

/** Resolve env var with brand-specific → generic → legacy fallback */
function resolveEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    if (process.env[k]) return process.env[k]
  }
  return undefined
}

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  const bp = brandPrefix()

  const supabaseUrl = resolveEnv(
    `NEXT_PUBLIC_${bp}_SUPABASE_URL`,
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_WINDCHASERS_SUPABASE_URL',
  ) || 'https://placeholder.supabase.co'

  const supabaseAnonKey = resolveEnv(
    `NEXT_PUBLIC_${bp}_SUPABASE_ANON_KEY`,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_WINDCHASERS_SUPABASE_ANON_KEY',
  ) || 'placeholder-key'

  // Enhanced error checking
  const hasUrl = supabaseUrl !== 'https://placeholder.supabase.co'
  const hasKey = supabaseAnonKey !== 'placeholder-key'

  if (!hasUrl || !hasKey) {
    console.error(`❌ Supabase environment variables are not set! (brand=${bp})`)
    console.error('   Missing:', { url: !hasUrl, anonKey: !hasKey })
    console.error(`   Please configure NEXT_PUBLIC_${bp}_SUPABASE_URL and NEXT_PUBLIC_${bp}_SUPABASE_ANON_KEY`)
  }

  supabaseClient = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )

  return supabaseClient
}
