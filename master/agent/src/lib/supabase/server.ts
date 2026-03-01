import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

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

export async function createClient() {
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

  const hasUrl = supabaseUrl !== 'https://placeholder.supabase.co'
  const hasKey = supabaseAnonKey !== 'placeholder-key'

  if (!hasUrl || !hasKey) {
    console.error(`❌ [Server] Supabase environment variables are not set! (brand=${bp})`)
    console.error('   Missing:', { url: !hasUrl, anonKey: !hasKey })
    console.error(`   Please configure NEXT_PUBLIC_${bp}_SUPABASE_URL and NEXT_PUBLIC_${bp}_SUPABASE_ANON_KEY`)
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, {
              ...options,
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: options.httpOnly ?? false,
            })
          } catch (error) {
            // Cookie setting can fail in some contexts (e.g., during redirects)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', {
              ...options,
              maxAge: 0,
            })
          } catch (error) {
            // Cookie removal can fail in some contexts
          }
        },
      },
    }
  )
}
