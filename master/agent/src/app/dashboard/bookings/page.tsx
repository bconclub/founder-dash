'use client'

import { Suspense } from 'react'
import BookingsCalendar from '@/components/dashboard/BookingsCalendar'
import { BookingsSkeleton } from '@/components/dashboard/Skeleton'

function BookingsPageContent() {
  return (
    <BookingsCalendar view="calendar" />
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsSkeleton />}>
      <BookingsPageContent />
    </Suspense>
  )
}
