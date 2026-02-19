import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Calendar, Vote as VoteIcon } from 'lucide-react'

export default async function PolicyAreaDetailPage({
  params,
}: {
  params: Promise<{ area: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { area } = await params
  const policyArea = decodeURIComponent(area)

  const bills = await prisma.bill.findMany({
    where: { policyArea },
    include: { _count: { select: { votes: true } } },
    orderBy: { introducedDate: 'desc' },
  })

  if (bills.length === 0) notFound()

  const totalVotes = bills.reduce((sum, b) => sum + b._count.votes, 0)

  const statusLabels: Record<string, { label: string; cls: string }> = {
    enacted: { label: 'Enacted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    passed_both: { label: 'Passed Both', cls: 'bg-green-50 text-green-700 border-green-200' },
    passed_chamber: { label: 'Passed Chamber', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    reported: { label: 'Reported', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_committee: { label: 'In Committee', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    introduced: { label: 'Introduced', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  bills.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
  })

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/policy-areas" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Policy Areas
      </Link>

      {/* Header */}
      <div className="hero-gradient rounded-2xl px-8 py-7 mb-6">
        <div className="badge bg-white/10 text-white/80 border border-white/10 mb-3">Policy Area</div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
          {policyArea}
        </h1>
        <div className="flex items-center gap-6 text-sm text-white/40">
          <span>{bills.length} bill{bills.length !== 1 ? 's' : ''}</span>
          <span>{totalVotes} citizen vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Status breakdown */}
      {Object.keys(statusCounts).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const st = statusLabels[status] || statusLabels.introduced
              return (
                <span key={status} className={`badge border ${st.cls}`}>
                  {st.label}: {count}
                </span>
              )
            })}
        </div>
      )}

      {/* Bill list */}
      <div className="space-y-3">
        {bills.map(bill => {
          const st = statusLabels[bill.status] || statusLabels.introduced
          return (
            <Link key={bill.id} href={`/bills/${bill.id}`}
              className="card-interactive flex items-center gap-4 p-5 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
                  <span className={`badge border ${st.cls}`}>{st.label}</span>
                </div>
                <h2 className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug mb-1">
                  {bill.shortTitle || bill.title}
                </h2>
                {bill.summary && (
                  <p className="text-xs text-[--text-muted] line-clamp-1">{bill.summary.replace(/<[^>]+>/g, '')}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-[--text-muted]">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(bill.introducedDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><VoteIcon className="w-3 h-3" />{bill._count.votes} votes</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
