/**
 * Related bills — the cross-link module that keeps share-link visitors from
 * dead-ending on a bill page. Shows the most recently active bills in the
 * same policy area, with the citizen vote count as a social-proof hook.
 */

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Grid3X3, ArrowRight } from 'lucide-react'

interface Props {
  billId: string
  policyArea: string | null
}

export default async function RelatedBills({ billId, policyArea }: Props) {
  if (!policyArea) return null

  const related = await prisma.bill.findMany({
    where: { policyArea, id: { not: billId } },
    orderBy: { latestActionDate: 'desc' },
    take: 4,
    select: {
      id: true, billType: true, billNumber: true,
      title: true, shortTitle: true, status: true,
      voteAggregate: { select: { totalVotes: true } },
    },
  })

  if (related.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[--border] flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-[--accent]" />
        <div>
          <h3 className="font-display text-sm font-bold text-[--text]">More on {policyArea}</h3>
          <p className="text-xs text-[--text-muted]">Other bills in this policy area</p>
        </div>
      </div>
      <div className="divide-y divide-[--border]">
        {related.map(b => (
          <Link
            key={b.id}
            href={`/bills/${b.id}`}
            className="block px-5 py-3 hover:bg-[--surface-secondary] transition-colors group"
          >
            <p className="text-xs font-bold text-[--text-muted] mb-0.5">{b.billType} {b.billNumber}</p>
            <p className="text-sm font-medium text-[--text] leading-snug line-clamp-2 group-hover:text-[--accent] transition-colors">
              {b.shortTitle || b.title}
            </p>
            {(b.voteAggregate?.totalVotes ?? 0) > 0 && (
              <p className="text-[10px] text-[--text-muted] mt-1">
                {b.voteAggregate!.totalVotes} citizen vote{b.voteAggregate!.totalVotes !== 1 ? 's' : ''}
              </p>
            )}
          </Link>
        ))}
      </div>
      <Link
        href={`/bills?policyArea=${encodeURIComponent(policyArea)}`}
        className="flex items-center justify-center gap-1 px-5 py-3 border-t border-[--border] text-xs font-semibold text-[--accent] hover:bg-[--surface-secondary] transition-colors"
      >
        All {policyArea} bills <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
