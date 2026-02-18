import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import Link from 'next/link'
import { FileText, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import BillFilters from '@/components/bills/BillFilters'

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; year?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { bills, total } = await BillService.getBills({
    search: params.search,
    status: params.status,
    year: params.year,
    limit,
    offset,
  })

  const totalPages = Math.ceil(total / limit)

  // Build query string preserving filters
  function buildQuery(p: number) {
    const q = new URLSearchParams()
    q.set('page', String(p))
    if (params.search) q.set('search', params.search)
    if (params.status) q.set('status', params.status)
    if (params.year) q.set('year', params.year)
    return q.toString()
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Congressional Bills
          </h1>
        </div>
        <p className="text-gray-600 ml-[52px]">
          Browse and vote on current legislation. <span className="font-semibold text-indigo-600">{total}</span> bill{total !== 1 ? 's' : ''} available.
        </p>
      </div>

      {/* Filters */}
      <BillFilters />

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bills found</h3>
          <p className="text-gray-500">
            {params.search || params.status || params.year
              ? 'Try adjusting your search or filters.'
              : 'Bills will appear here once synced.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill: any) => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="group block bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-indigo-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                      {bill.billType} {bill.billNumber}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      bill.status === 'enacted'
                        ? 'bg-green-50 text-green-700'
                        : bill.status === 'passed_chamber' || bill.status === 'passed_both'
                        ? 'bg-amber-50 text-amber-700'
                        : bill.status === 'in_committee'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {bill.status.replace(/_/g, ' ')}
                    </span>
                    {bill.policyArea && (
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-md">
                        {bill.policyArea}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mb-1.5 leading-snug">
                    {bill.title}
                  </h2>
                  {bill.summary && (
                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                      {bill.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-5 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(bill.introducedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{bill._count?.votes || 0} votes</span>
                </div>
                {(bill as any).aiSummary && (
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Analyzed</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/bills?${buildQuery(page - 1)}`} className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              Previous
            </Link>
          )}
          <span className="px-5 py-2.5 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/bills?${buildQuery(page + 1)}`} className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
