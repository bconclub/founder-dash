'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href?: string
  icon: string
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Leads', href: '/dashboard/leads', icon: '👥' },
  { name: 'Bookings', href: '/dashboard/bookings', icon: '📅' },
  { name: 'Metrics', href: '/dashboard/metrics', icon: '📈' },
  { name: 'Channels', icon: '🔌', children: [
    { name: 'Web PROXe', href: '/dashboard/channels/web', icon: '🌐' },
    { name: 'WhatsApp PROXe', href: '/dashboard/channels/whatsapp', icon: '💬' },
    { name: 'Voice PROXe', href: '/dashboard/channels/voice', icon: '📞' },
    { name: 'Social PROXe', href: '/dashboard/channels/social', icon: '📱' },
  ]},
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D0D]">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1A1A1A] border-r border-gray-200 dark:border-[#262626]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">PROXe HQ</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                if (item.children) {
                  // Render parent with children
                  const isParentActive = item.children.some((child) => pathname === child.href)
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className={cn(
                        'px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider'
                      )}>
                        <span className="mr-2">{item.icon}</span>
                        {item.name}
                      </div>
                      {item.children.map((child) => {
                        if (!child.href) return null
                        const isActive = pathname === child.href
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              'group flex items-center px-2 py-2 text-sm font-medium rounded-md ml-4',
                              isActive
                                ? 'bg-primary-100 text-primary-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <span className="mr-3">{child.icon}</span>
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )
                }
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <h2 className="text-2xl font-semibold text-gray-900 self-center">
                  {navigation.find((item) => item.href === pathname)?.name || 
                   navigation.flatMap((item) => item.children || []).find((child) => child.href === pathname)?.name ||
                   'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      U
                    </div>
                  </button>
                </div>
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

