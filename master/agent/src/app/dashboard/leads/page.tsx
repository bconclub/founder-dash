'use client'

import { Suspense } from 'react'
import LeadsTable from '@/components/dashboard/LeadsTable'
import { LeadsSkeleton } from '@/components/dashboard/Skeleton'

function LeadsPageContent() {
  return <LeadsTable showLimitSelector />
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsPageContent />
    </Suspense>
  )
}
