'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import CollapsibleCard from '@/components/ui/CollapsibleCard'

interface TrackedBill {
  id: string
  title: string
  shortTitle?: string | null
  status: string
  position: string
}

const STATUS_COLORS: Record<string, string> = {
  enacted: 'bg-emerald-500',
  passed_both: 'bg-green-500',
  passed_chamber: 'bg-green-400',
  reported: 'bg-blue-500',
  in_committee: 'bg-blue-400',
  introduced: 'bg-amber-500',
}

const STATUS_LABELS: Record<string, string> = {
  enacted: 'Enacted',
  passed_both: 'Passed Both',
  passed_chamber: 'Passed House',
  reported: 'Reported',
  in_committee: 'In Committee',
  introduced: 'Introduced',
}

const VOTE_DISPLAY: Record<string, { label: string; cls: string }> = {
  yes: { label: 'YES', cls: 'text-emerald-600 font-bold' },
  no: { label: 'NO', cls: 'text-red-600 font-bold' },
  abstain: { label: 'ABSTAIN', cls: 'text-gray-500 font-bold' },
}

export default function TrackedBills({ bills }: { bills: TrackedBill[] }) {
  return (
    <CollapsibleCard
      storageKey="tracked-bills"
      title="Tracked Bills"
      headerRight={
        <span className="text-xs text-[--text-muted]">{bills.length} active</span>
      }
    >
      {bills.length === 0 ? (
        <div className="px-6 py-7">
          <p className="text-sm font-semibold text-[--text] text-center mb-1">You&apos;re not tracking any bills yet</p>
          <p className="text-xs text-[--text-muted] text-center mb-4">
            Voting on a bill tracks it automatically — you&apos;ll see its status here as it moves through Congress.
          </p>
          <ol className="text-xs text-[--text-secondary] space-y-1.5 max-w-xs mx-auto mb-4">
            <li><span className="font-bold text-[--accent]">1.</span> Open any bill from the Track section</li>
            <li><span className="font-bold text-[--accent]">2.</span> Read the plain-English summary</li>
            <li><span className="font-bold text-[--accent]">3.</span> Vote yes, no, or abstain — that&apos;s it</li>
          </ol>
          <div className="text-center">
            <Link href="/bills" className="btn-primary text-xs inline-flex">
              Find a bill to track →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[--border]">
            {bills.map(bill => {
              const borderColor = STATUS_COLORS[bill.status] || 'bg-gray-400'
              const statusLabel = STATUS_LABELS[bill.status] || bill.status
              const vote = VOTE_DISPLAY[bill.position] || VOTE_DISPLAY.abstain

              return (
                <Link key={bill.id} href={`/bills/${bill.id}`}
                  className="flex items-stretch hover:bg-[--surface-secondary] transition-colors group"
                >
                  <div className={`w-1 ${borderColor} shrink-0`} />
                  <div className="flex-1 px-5 py-4 min-w-0">
                    <h3 className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug mb-1 line-clamp-1">
                      {bill.shortTitle || bill.title}
                    </h3>
                    <p className="text-xs text-[--text-muted] mb-1">Status: {statusLabel}</p>
                    <p className="text-xs">
                      Your vote: <span className={vote.cls}>{vote.label}</span>
                    </p>
                  </div>
                  <div className="flex items-center pr-4">
                    <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="px-6 py-3 border-t border-[--border]">
            <Link href="/bills" className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
              View all bills →
            </Link>
          </div>
        </>
      )}
    </CollapsibleCard>
  )
}
