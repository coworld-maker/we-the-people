import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import Link from 'next/link'
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

  function buildQuery(p: number) {
    const q = new URLSearchParams()
    q.set('page', String(p))
    if (params.search) q.set('search', params.search)
    if (params.status) q.set('status', params.status)
    if (params.year) q.set('year', params.year)
    return q.toString()
  }

  const statusConfig: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
    enacted: { label: 'Enacted', emoji: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    passed_both: { label: 'Passed Both', emoji: '🏛️', bg: 'bg-green-50', text: 'text-green-700' },
    passed_chamber: { label: 'Passed Chamber', emoji: '📋', bg: 'bg-amber-50', text: 'text-amber-700' },
    reported: { label: 'Reported', emoji: '📝', bg: 'bg-blue-50', text: 'text-blue-700' },
    in_committee: { label: 'In Committee', emoji: '🔍', bg: 'bg-orange-50', text: 'text-orange-700' },
    introduced: { label: 'Introduced', emoji: '📌', bg: 'bg-gray-50', text: 'text-gray-600' },
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F172A]">📜 Congressional Bills</h1>
        <p className="text-gray-500 font-body mt-1">
          <span className="font-semibold text-[#6366F1]">{total}</span> bill{total !== 1 ? 's' : ''} to explore and vote on
        </p>
      </div>

      <BillFilters />

      {bills.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-16 text-center border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-xl font-bold text-[#0F172A] mb-2">No bills found</h3>
          <p className="text-gray-500 font-body">{params.search || params.status || params.year ? 'Try adjusting your filters.' : 'Bills will appear once synced.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill: any) => {
            const sc = statusConfig[bill.status] || statusConfig.introduced
            return (
              <Link key={bill.id} href={`/bills/${bill.id}`}
                className="group block bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className={`hidden sm:flex w-12 h-12 ${sc.bg} rounded-xl items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform`}>
                    {sc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#0F172A] text-white text-xs font-bold rounded-lg">{bill.billType} {bill.billNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${sc.bg} ${sc.text} text-xs font-bold rounded-lg`}>{sc.label}</span>
                      {bill.policyArea && <span className="inline-flex items-center px-2.5 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg">{bill.policyArea}</span>}
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#6366F1] transition-colors leading-snug mb-1.5">
                      {bill.shortTitle || bill.title}
                    </h2>
                    {bill.summary && (
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed font-body mb-3">{bill.summary.replace(/<[^>]+>/g, '')}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span>📅 {new Date(bill.introducedDate).toLocaleDateString()}</span>
                      <span>🗳️ {bill._count?.votes || 0} votes</span>
                      {bill.originChamber && <span>{bill.originChamber === 'senate' ? '🏛️ Senate' : '🏠 House'}</span>}
                      {(bill as any).aiSummary && <span className="text-amber-500 font-semibold">✨ AI Analyzed</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors shrink-0 self-center">
                    <span className="text-gray-300 group-hover:text-[#6366F1] transition-colors text-lg">→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-3">
          {page > 1 && <Link href={`/bills?${buildQuery(page - 1)}`} className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-[#0F172A] shadow-sm">← Previous</Link>}
          <span className="px-6 py-3 text-sm text-gray-400 font-medium">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/bills?${buildQuery(page + 1)}`} className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-[#0F172A] shadow-sm">Next →</Link>}
        </div>
      )}
    </div>
  )
}
