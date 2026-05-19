import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, FileText, Calendar, Vote as VoteIcon, MapPin } from 'lucide-react'
import BillFilters from '@/components/bills/BillFilters'

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; search?: string; status?: string; year?: string;
    policyArea?: string; affectsState?: string; votedInState?: string; voted?: string;
  }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Fetch user (state + internal id), policy areas list, in parallel with bills
  const userRow = await prisma.user.findUnique({
    where: { clerkId: userId }, select: { id: true, state: true },
  })
  const userState = userRow?.state ?? null
  const userInternalId = userRow?.id ?? null

  // Translate URL flags to service filters. State-aware filters silently no-op
  // when the user hasn't picked a state yet.
  const affectsState = params.affectsState === '1' && userState ? userState : undefined
  const votedInState = params.votedInState === '1' && userState ? userState : undefined
  const votedByUserId = params.voted === 'yes' && userInternalId ? userInternalId : undefined
  const notVotedByUserId = params.voted === 'no' && userInternalId ? userInternalId : undefined

  const [{ bills, total }, policyAreas] = await Promise.all([
    BillService.getBills({
      search: params.search, status: params.status, year: params.year,
      policyArea: params.policyArea,
      affectsState, votedInState, votedByUserId, notVotedByUserId,
      limit, offset,
    }),
    BillService.getPolicyAreas(),
  ])

  const totalPages = Math.ceil(total / limit)

  function buildQuery(p: number) {
    const q = new URLSearchParams()
    q.set('page', String(p))
    if (params.search) q.set('search', params.search)
    if (params.status) q.set('status', params.status)
    if (params.year) q.set('year', params.year)
    if (params.policyArea) q.set('policyArea', params.policyArea)
    if (params.affectsState) q.set('affectsState', params.affectsState)
    if (params.votedInState) q.set('votedInState', params.votedInState)
    if (params.voted) q.set('voted', params.voted)
    return q.toString()
  }

  const hasAnyFilter = Boolean(
    params.search || params.status || params.year || params.policyArea ||
    params.affectsState || params.votedInState || params.voted
  )

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

      <BillFilters policyAreas={policyAreas} userState={userState} />

      {bills.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-[--text-muted] mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-[--text] mb-1">No bills found</h3>
          <p className="text-sm text-[--text-muted]">
            {hasAnyFilter ? 'Try adjusting your filters.' : 'Bills will appear once synced.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill: any) => {
            const st = statusLabels[bill.status] || statusLabels.introduced
            // "Affects your state" badge — shown when this bill's AI-generated state-impact
            // score for the user's home state is at least 0.6 (moderate-to-high impact)
            const stateImpactScore =
              userState && bill.stateImpacts && typeof bill.stateImpacts === 'object'
                ? (bill.stateImpacts as Record<string, { score: number }>)[userState]?.score
                : undefined
            const affectsYourState = typeof stateImpactScore === 'number' && stateImpactScore >= 0.6
            return (
              <Link key={bill.id} href={`/bills/${bill.id}`}
                className="group card-interactive flex items-center gap-4 p-5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
                    <span className={`badge border ${st.cls}`}>{st.label}</span>
                    {bill.policyArea && <span className="badge bg-[--accent-light] text-[--accent]">{bill.policyArea}</span>}
                    {affectsYourState && (
                      <span className="badge bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Affects {userState}
                      </span>
                    )}
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
