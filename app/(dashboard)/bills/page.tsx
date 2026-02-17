import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import Link from 'next/link'
import { FileText, Calendar, TrendingUp } from 'lucide-react'

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Next.js 15: searchParams is a Promise and must be awaited
  const params = await searchParams

  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { bills, total } = await BillService.getBills({
    search: params.search,
    status: params.status,
    limit,
    offset,
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Congressional Bills
        </h1>
        <p className="text-gray-600">
          Browse and vote on current legislation from Congress.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search bills..."
            defaultValue={params.search}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            defaultValue={params.status}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="introduced">Introduced</option>
            <option value="passed">Passed</option>
            <option value="enacted">Enacted</option>
          </select>
        </div>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No bills found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill: any) => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      {bill.billType} {bill.billNumber}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      {bill.status}
                    </span>
                    {bill.policyArea && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {bill.policyArea}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {bill.title}
                  </h2>
                  {bill.summary && (
                    <p className="text-gray-600 line-clamp-2">
                      {bill.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(bill.introducedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {bill._count?.votes || 0} votes
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/bills?page=${page - 1}${params.search ? `&search=${params.search}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/bills?page=${page + 1}${params.search ? `&search=${params.search}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
