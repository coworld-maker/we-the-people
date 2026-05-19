import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, FileText, Vote, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Policy Areas | Democracy Unlocked',
  description: 'Browse Congressional bills organized by policy area.',
}

// Per-area accent palette (kept in sync with /bills grouped view)
const AREA_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
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
const DEFAULT_CONFIG = { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }

export default async function PolicyAreasPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Aggregate bills by policy area with vote counts + status breakdown
  const bills = await prisma.bill.findMany({
    where: { policyArea: { not: null } },
    select: {
      policyArea: true,
      status: true,
      _count: { select: { votes: true } },
    },
  })

  const areaMap = new Map<string, { count: number; votes: number; statuses: Record<string, number> }>()
  bills.forEach(bill => {
    const area = bill.policyArea || 'Other'
    const existing = areaMap.get(area) || { count: 0, votes: 0, statuses: {} }
    existing.count++
    existing.votes += bill._count.votes
    existing.statuses[bill.status] = (existing.statuses[bill.status] || 0) + 1
    areaMap.set(area, existing)
  })

  const areas = Array.from(areaMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)

  const totalBills = areas.reduce((sum, a) => sum + a.count, 0)
  const totalVotes = areas.reduce((sum, a) => sum + a.votes, 0)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[--text]">Policy Areas</h1>
          <p className="text-sm text-[--text-secondary] mt-1">
            {areas.length} policy areas covering {totalBills} bills
          </p>
        </div>
        <Link
          href="/bills?groupBy=policy"
          className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
        >
          See all bills grouped by policy →
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: FileText, label: 'Total bills', value: totalBills, accent: 'text-[--accent]' },
          { icon: Vote, label: 'Total votes', value: totalVotes, accent: 'text-purple-600' },
          { icon: TrendingUp, label: 'Policy areas', value: areas.length, accent: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-[--text-muted]" />
              <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`font-display text-2xl font-extrabold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Policy area grid — each card links to /bills filtered to that area */}
      {areas.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-[--text-muted] mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-[--text] mb-1">No policy areas yet</h3>
          <p className="text-sm text-[--text-muted]">Bills will be categorized once synced.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {areas.map(area => {
            const cfg = AREA_CONFIG[area.name] || DEFAULT_CONFIG
            const enacted = area.statuses['enacted'] || 0

            return (
              <Link
                key={area.name}
                href={`/bills?policyArea=${encodeURIComponent(area.name)}`}
                className="card-interactive p-5 group"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div
                    className={`badge ${cfg.bg} ${cfg.color} border ${cfg.border} text-left leading-snug`}
                    style={{ whiteSpace: 'normal' }}
                  >
                    {area.name}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0 mt-0.5" />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl font-extrabold text-[--text]">{area.count}</p>
                    <p className="text-xs text-[--text-muted]">bill{area.count !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[--text-muted]">
                    {area.votes > 0 && (
                      <div className="text-right">
                        <p className="font-semibold text-[--text]">{area.votes}</p>
                        <p>votes</p>
                      </div>
                    )}
                    {enacted > 0 && (
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">{enacted}</p>
                        <p>enacted</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity bar (vote-to-bill ratio) */}
                <div className="mt-3 h-1.5 rounded-full bg-[--surface-tertiary] overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-[--accent] transition-all"
                    style={{ width: `${Math.min((area.votes / Math.max(area.count, 1)) * 20, 100)}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
