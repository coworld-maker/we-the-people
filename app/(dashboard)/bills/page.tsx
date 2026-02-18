import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import Link from 'next/link'
import { ChevronRight, FileText, Calendar, Vote as VoteIcon } from 'lucide-react'
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
    search: params.search, status: params.status, year: params.year, limit, offset,
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

  const statusLabels: Record<string, { label: string; cls: string }> = {
    enacted: { label: 'Enacted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    passed_both: { label: 'Passed Both', cls: 'bg-green-50 text-green-700 border-green-200' },
    passed_chamber: { label: 'Passed Chamber', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    reported: { label: 'Reported', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_committee: { label: 'In Committee', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    introduced: { label: 'Introduced', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[--text]">Bills</h1>
        <p className="text-sm text-[--text-secondary] mt-1">
          {total} bill{total !== 1 ? 's' : ''} from the 118th Congress
        </p>
      </div>

      <BillFilters />

      {bills.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-[--text-muted] mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-[--text] mb-1">No bills found</h3>
          <p className="text-sm text-[--text-muted]">
            {params.search || params.status || params.year ? 'Try adjusting your filters.' : 'Bills will appear once synced.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill: any) => {
            const st = statusLabels[bill.status] || statusLabels.introduced
            return (
              <Link key={bill.id} href={`/bills/${bill.id}`}
                className="group card-interactive flex items-center gap-4 p-5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
                    <span className={`badge border ${st.cls}`}>{st.label}</span>
                    {bill.policyArea && <span className="badge bg-[--accent-light] text-[--accent]">{bill.policyArea}</span>}
                  </div>
                  <h2 className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug mb-1">
                    {bill.shortTitle || bill.title}
                  </h2>
                  {bill.summary && (
                    <p className="text-xs text-[--text-muted] line-clamp-1">{bill.summary.replace(/<[^>]+>/g, '')}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[--text-muted]">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(bill.introducedDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><VoteIcon className="w-3 h-3" />{bill._count?.votes || 0} votes</span>
                    {(bill as any).aiSummary && <span className="text-[--accent] font-medium">AI analyzed</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && <Link href={`/bills?${buildQuery(page - 1)}`} className="btn-secondary text-xs px-4 py-2">Previous</Link>}
          <span className="px-4 py-2 text-xs text-[--text-muted]">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/bills?${buildQuery(page + 1)}`} className="btn-secondary text-xs px-4 py-2">Next</Link>}
        </div>
      )}
    </div>
  )
}
