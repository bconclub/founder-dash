import { createClient } from '@/lib/supabase/server'
import MetricsDashboard from '@/components/dashboard/MetricsDashboard'
import LeadsTable from '@/components/dashboard/LeadsTable'
import BookingsCalendar from '@/components/dashboard/BookingsCalendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your leads and bookings.
        </p>
      </div>

      {/* Metrics Cards */}
      <MetricsDashboard />

      {/* Channel Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="/dashboard/channels/web" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Web PROXe</h3>
              <p className="text-sm text-gray-500 mt-1">Web chat leads</p>
            </div>
            <div className="text-3xl">🌐</div>
          </div>
        </a>
        <a href="/dashboard/channels/whatsapp" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">WhatsApp PROXe</h3>
              <p className="text-sm text-gray-500 mt-1">WhatsApp conversations</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </a>
        <a href="/dashboard/channels/voice" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Voice PROXe</h3>
              <p className="text-sm text-gray-500 mt-1">Voice call leads</p>
            </div>
            <div className="text-3xl">📞</div>
          </div>
        </a>
        <a href="/dashboard/channels/social" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Social PROXe</h3>
              <p className="text-sm text-gray-500 mt-1">Social media leads</p>
            </div>
            <div className="text-3xl">📱</div>
          </div>
        </a>
      </div>

      {/* Recent Leads */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Leads</h2>
          <LeadsTable limit={10} />
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Bookings</h2>
          <BookingsCalendar view="upcoming" />
        </div>
      </div>
    </div>
  )
}

