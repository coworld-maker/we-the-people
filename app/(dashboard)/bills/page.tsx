import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, FileText, Calendar, Vote as VoteIcon, MapPin } from 'lucide-react'
import BillFilters from '@/components/bills/BillFilters'

// Per-policy-area accent palette — used for section headers in the grouped view
const AREA_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  'Armed Forces and National Security':       { color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Commerce':                                 { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  'Crime and Law Enforcement':                { color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  'Economics and Public Finance':             { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Education':                                { color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  'Energy':                                   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Environmental Protection':                 { color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
  'Finance and Financial Sector':             { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Foreign Trade and International Finance':  { color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200' },
  'Government Operations and Politics':       { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  'Health':                                   { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'Housing and Community Development':        { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'Immigration':                              { color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'International Affairs':                    { color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200' },
  'Labor and Employment':                     { color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Public Lands and Natural Resources':       { color: 'text-lime-700',    bg: 'bg-lime-50',    border: 'border-lime-200' },
  'Science, Technology, Communications':      { color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Social Welfare':                           { color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
  'Taxation':                                 { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Transportation and Public Works':          { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
}
const DEFAULT_AREA_COLOR = { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  enacted:        { label: 'Enacted',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  passed_both:    { label: 'Passed Both',     cls: 'bg-green-50 text-green-700 border-green-200' },
  passed_chamber: { label: 'Passed Chamber',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  reported:       { label: 'Reported',        cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_committee:   { label: 'In Committee',    cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  introduced:     { label: 'Introduced',      cls: 'bg-gray-50 text-gray-600 border-gray-200' },
}

// ── Bill card (shared by flat + grouped views) ───────────────────────────────

function BillCard({ bill, userState, showPolicyBadge = true }: {
  bill: any
  userState: string | null
  showPolicyBadge?: boolean
}) {
  const st = STATUS_LABELS[bill.status] || STATUS_LABELS.introduced
  const stateImpactScore =
    userState && bill.stateImpacts && typeof bill.stateImpacts === 'object'
      ? (bill.stateImpacts as Record<string, { score: number }>)[userState]?.score
      : undefined
  const affectsYourState = typeof stateImpactScore === 'number' && stateImpactScore >= 0.6

  return (
    <Link href={`/bills/${bill.id}`} className="group card-interactive flex items-center gap-4 p-5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
          <span className={`badge border ${st.cls}`}>{st.label}</span>
          {showPolicyBadge && bill.policyArea && (
            <span className="badge bg-[--accent-light] text-[--accent]">{bill.policyArea}</span>
          )}
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
          {bill.aiSummary && <span className="text-[--accent] font-medium">AI analyzed</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; search?: string; status?: string; year?: string;
    policyArea?: string; affectsState?: string; votedInState?: string; voted?: string;
    groupBy?: string;
  }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const groupByPolicy = params.groupBy === 'policy'

  const userRow = await prisma.user.findUnique({
    where: { clerkId: userId }, select: { id: true, state: true },
  })
  const userState = userRow?.state ?? null
  const userInternalId = userRow?.id ?? null

  const affectsState     = params.affectsState === '1' && userState ? userState : undefined
  const votedInState     = params.votedInState === '1' && userState ? userState : undefined
  const votedByUserId    = params.voted === 'yes' && userInternalId ? userInternalId : undefined
  const notVotedByUserId = params.voted === 'no'  && userInternalId ? userInternalId : undefined

  // In grouped view we fetch a larger window (no pagination) so we can render
  // every section in one shot. Cap at 500 so a wide-open query doesn't blow up.
  const fetchLimit  = groupByPolicy ? 500 : limit
  const fetchOffset = groupByPolicy ? 0    : offset

  const [{ bills, total }, policyAreas] = await Promise.all([
    BillService.getBills({
      search: params.search, status: params.status, year: params.year,
      policyArea: params.policyArea,
      affectsState, votedInState, votedByUserId, notVotedByUserId,
      limit: fetchLimit, offset: fetchOffset,
    }),
    BillService.getPolicyAreas(),
  ])

  const totalPages = Math.ceil(total / limit)

  function buildQuery(p: number) {
    const q = new URLSearchParams()
    q.set('page', String(p))
    if (params.search)       q.set('search', params.search)
    if (params.status)       q.set('status', params.status)
    if (params.year)         q.set('year', params.year)
    if (params.policyArea)   q.set('policyArea', params.policyArea)
    if (params.affectsState) q.set('affectsState', params.affectsState)
    if (params.votedInState) q.set('votedInState', params.votedInState)
    if (params.voted)        q.set('voted', params.voted)
    if (params.groupBy)      q.set('groupBy', params.groupBy)
    return q.toString()
  }

  const hasAnyFilter = Boolean(
    params.search || params.status || params.year || params.policyArea ||
    params.affectsState || params.votedInState || params.voted
  )

  // ── Group bills by policy area for the grouped view ────────────────────────
  const grouped = groupByPolicy
    ? (() => {
        const map = new Map<string, { bills: any[]; votes: number; enacted: number }>()
        for (const b of bills) {
          const key = b.policyArea || 'Uncategorized'
          const entry = map.get(key) ?? { bills: [], votes: 0, enacted: 0 }
          entry.bills.push(b)
          entry.votes += b._count?.votes || 0
          if (b.status === 'enacted') entry.enacted++
          map.set(key, entry)
        }
        // Sort sections by bill count, descending
        return Array.from(map.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.bills.length - a.bills.length)
      })()
    : null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[--text]">Bills</h1>
          <p className="text-sm text-[--text-secondary] mt-1">
            {total} bill{total !== 1 ? 's' : ''} from the 118th Congress
            {groupByPolicy && grouped && <> · {grouped.length} polic{grouped.length === 1 ? 'y area' : 'y areas'}</>}
          </p>
        </div>

        {/* View-mode segmented control */}
        <div className="inline-flex rounded-lg border border-[--border] bg-[--surface] overflow-hidden text-xs font-semibold">
          <Link
            href={`/bills?${(() => { const q = new URLSearchParams(); ['search','status','year','policyArea','affectsState','votedInState','voted'].forEach(k => { if ((params as any)[k]) q.set(k, (params as any)[k]) }); return q.toString() })()}`}
            className={`px-3 py-1.5 transition-colors ${!groupByPolicy ? 'bg-[--accent] text-white' : 'text-[--text-secondary] hover:bg-[--surface-secondary]'}`}
          >
            List
          </Link>
          <Link
            href={`/bills?${(() => { const q = new URLSearchParams(); ['search','status','year','policyArea','affectsState','votedInState','voted'].forEach(k => { if ((params as any)[k]) q.set(k, (params as any)[k]) }); q.set('groupBy', 'policy'); return q.toString() })()}`}
            className={`px-3 py-1.5 transition-colors border-l border-[--border] ${groupByPolicy ? 'bg-[--accent] text-white' : 'text-[--text-secondary] hover:bg-[--surface-secondary]'}`}
          >
            By policy area
          </Link>
        </div>
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
      ) : groupByPolicy && grouped ? (
        /* ── Grouped view: bills sectioned by policy area ──────────────────── */
        <div className="space-y-8">
          {grouped.map(group => {
            const cfg = AREA_COLORS[group.name] || DEFAULT_AREA_COLOR
            return (
              <section key={group.name}>
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${cfg.bg} ${cfg.color} border ${cfg.border} text-sm`}>
                      {group.name}
                    </span>
                    <span className="text-xs text-[--text-muted]">
                      {group.bills.length} bill{group.bills.length !== 1 ? 's' : ''}
                      {group.votes > 0 && ` · ${group.votes} vote${group.votes !== 1 ? 's' : ''}`}
                      {group.enacted > 0 && ` · ${group.enacted} enacted`}
                    </span>
                  </div>
                  <Link
                    href={`/bills?${(() => { const q = new URLSearchParams(); q.set('policyArea', group.name); ['search','status','year','affectsState','votedInState','voted'].forEach(k => { if ((params as any)[k]) q.set(k, (params as any)[k]) }); return q.toString() })()}`}
                    className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
                  >
                    Filter to this area →
                  </Link>
                </div>
                <div className="space-y-3">
                  {group.bills.map((bill: any) => (
                    <BillCard key={bill.id} bill={bill} userState={userState} showPolicyBadge={false} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        /* ── Flat list view ─────────────────────────────────────────────────── */
        <div className="space-y-3">
          {bills.map((bill: any) => <BillCard key={bill.id} bill={bill} userState={userState} />)}
        </div>
      )}

      {/* Pagination — flat view only */}
      {!groupByPolicy && totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && <Link href={`/bills?${buildQuery(page - 1)}`} className="btn-secondary text-xs px-4 py-2">Previous</Link>}
          <span className="px-4 py-2 text-xs text-[--text-muted]">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/bills?${buildQuery(page + 1)}`} className="btn-secondary text-xs px-4 py-2">Next</Link>}
        </div>
      )}
    </div>
  )
}
