import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ThemeProvider from '@/components/dashboard/ThemeProvider'

export const dynamic = 'force-dynamic'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // DEVELOPMENT BYPASS: Uncomment to bypass auth in development
  // if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  //   console.warn('⚠️ AUTH BYPASSED: Development mode with BYPASS_AUTH=true')
  //   return (
  //     <ThemeProvider>
  //       <DashboardLayout>{children}</DashboardLayout>
  //     </ThemeProvider>
  //   )
  // }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/ccc34e9d-10fc-4755-9d86-188049e8d67e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:29',message:'auth.getUser result',data:{hasUser:!!user,errorStatus:(error as any)?.status || null,errorMessage:error?.message || null,nodeEnv:process.env.NODE_ENV || null},timestamp:Date.now(),sessionId:'debug-session',runId:'auth-redirect',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Dashboard layout auth check:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: error?.message,
        errorStatus: (error as any)?.status,
        willRedirect: !user && (error || !error),
      })
      
      // Log if we're about to redirect
      if (!user) {
        console.warn('⚠️ Dashboard layout: About to redirect to login because:', {
          hasError: !!error,
          errorMessage: error?.message,
          errorStatus: (error as any)?.status,
        })
      }
    }

    // Handle errors gracefully
    if (error) {
      const errorStatus = (error as any)?.status
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ccc34e9d-10fc-4755-9d86-188049e8d67e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:51',message:'auth error branch',data:{errorStatus:errorStatus || null,willRedirect:errorStatus === 400 || errorStatus === 401 || process.env.NODE_ENV !== 'development'},timestamp:Date.now(),sessionId:'debug-session',runId:'auth-redirect',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      
      // Rate limit - allow access but log warning
      if (errorStatus === 429) {
        console.warn('🚫 Dashboard layout: Rate limited, allowing access with degraded experience')
        // Continue - allow access even if rate limited
      } 
      // Invalid session or unauthorized - redirect to login
      else if (errorStatus === 400 || errorStatus === 401) {
        console.warn('🚫 Dashboard layout: Invalid session, redirecting to login')
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/ccc34e9d-10fc-4755-9d86-188049e8d67e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:61',message:'redirecting due to invalid session',data:{errorStatus:errorStatus || null},timestamp:Date.now(),sessionId:'debug-session',runId:'auth-redirect',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion agent log
        redirect('/auth/login')
      }
      // Other errors - log but don't block in development
      else if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Dashboard layout: Auth error but allowing in dev mode:', error.message)
      } else {
        // In production, redirect on auth errors
        console.warn('🚫 Dashboard layout: Auth error, redirecting to login')
        redirect('/auth/login')
      }
    }

    // If no user and no error, redirect to login
    if (!user && !error) {
      console.warn('🚫 Dashboard layout: No user found, redirecting to login')
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ccc34e9d-10fc-4755-9d86-188049e8d67e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:75',message:'redirecting due to missing user',data:{hasUser:false,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'auth-redirect',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion agent log
      redirect('/auth/login')
    }

    // User is authenticated, render dashboard
    return (
      <ThemeProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ThemeProvider>
    )
  } catch (error) {
    console.error('Dashboard layout error:', error)
    // On unexpected errors, redirect to login
    redirect('/auth/login')
  }
}


