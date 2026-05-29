import Link from 'next/link'
import { TrendingUp, ArrowRight, Zap } from 'lucide-react'

interface ActiveBill {
  id: string
  title: string
  shortTitle: string | null
  status: string
  latestActionDate: Date | string | null
  latestActionText: string | null
  policyArea: string | null
}

interface Props {
  bills: ActiveBill[]
}

const STATUS_URGENCY: Record<string, { label: string; cls: string }> = {
  enacted:         { label: 'Enacted', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  passed_both:     { label: 'Passed Congress', cls: 'bg-green-100 text-green-800 border-green-200' },
  passed_chamber:  { label: 'Passed a Chamber', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  reported:        { label: 'Left Committee', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_committee:    { label: 'Active in Committee', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  introduced:      { label: 'New Activity', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

function daysAgo(d: Date | string | null) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function MovingThisWeek({ bills }: Props) {
  if (bills.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Moving this week</h2>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[--accent]/10 text-[--accent] text-[10px] font-bold">
            {bills.length}
          </span>
        </div>
        <Link href="/bills" className="text-xs text-[--accent] font-semibold hover:underline flex items-center gap-0.5">
          All bills <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-[--border]">
        {bills.map(bill => {
          const urgency = STATUS_URGENCY[bill.status] || STATUS_URGENCY.introduced
          const name = bill.shortTitle || bill.title
          return (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[--text] leading-snug line-clamp-2 group-hover:text-[--accent] transition-colors">
                  {name}
                </p>
                {bill.latestActionText && (
                  <p className="text-xs text-[--text-muted] mt-0.5 line-clamp-1">{bill.latestActionText}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${urgency.cls}`}>
                    {urgency.label}
                  </span>
                  {bill.policyArea && (
                    <span className="text-[10px] text-[--text-muted]">{bill.policyArea}</span>
                  )}
                  <span className="text-[10px] text-[--text-muted] ml-auto">{daysAgo(bill.latestActionDate)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-[--border] bg-[--surface-secondary]">
        <p className="text-[11px] text-[--text-muted] text-center">
          Bills with congressional action in the past 7 days ·{' '}
          <Link href="/bills" className="text-[--accent] hover:underline font-medium">
            Browse all →
          </Link>
        </p>
      </div>
    </div>
  )
}
