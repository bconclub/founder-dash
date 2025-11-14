import BookingsCalendar from '@/components/dashboard/BookingsCalendar'

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings Calendar</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage scheduled demos and calls.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <BookingsCalendar />
        </div>
      </div>
    </div>
  )
}


