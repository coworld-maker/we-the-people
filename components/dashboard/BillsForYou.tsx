'use client'

import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'

interface Bill {
  id: string; title: string; shortTitle?: string | null; billType: string; billNumber: string
  policyArea: string | null; status: string; _count?: { votes: number }
}

export default function BillsForYou({ bills }: { bills: Bill[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-[--text]">Recommended for you</h3>
        <span className="text-[10px] font-medium text-[--text-muted] uppercase tracking-wider">Based on your interests</span>
      </div>
      {bills.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-[--text-muted]">You&apos;ve voted on everything available. Check back soon.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[--border]">
            {bills.map(bill => (
              <Link key={bill.id} href={`/bills/${bill.id}`}
                className="group flex items-center gap-3 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug line-clamp-2">
                    {bill.shortTitle || bill.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="badge bg-[--surface-tertiary] text-[--text-secondary]">{bill.billType} {bill.billNumber}</span>
                    {bill.policyArea && <span className="text-xs text-[--text-muted]">{bill.policyArea}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-[--border]">
            <Link href="/bills" className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] flex items-center gap-1">
              Browse all bills <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
