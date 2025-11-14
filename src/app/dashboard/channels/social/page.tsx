import ChannelMetrics from '@/components/dashboard/ChannelMetrics'
import LeadsTable from '@/components/dashboard/LeadsTable'

export default function SocialPROXePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social PROXe</h1>
        <p className="mt-2 text-sm text-gray-600">
          Monitor and manage leads from social media platforms.
        </p>
      </div>

      {/* Channel-specific metrics */}
      <ChannelMetrics channel="social" />

      {/* Channel-specific leads */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Social Media Leads</h2>
          <LeadsTable sourceFilter="social" />
        </div>
      </div>
    </div>
  )
}


