import LeadsTable from '@/components/dashboard/LeadsTable'

export default function LeadsPage() {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#262626] shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <LeadsTable showLimitSelector />
      </div>
    </div>
  )
}


