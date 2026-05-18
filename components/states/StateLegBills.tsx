'use client'

import { useEffect, useState } from 'react'
import { Landmark, ExternalLink, Clock } from 'lucide-react'

interface StateLegBill {
  id: string
  identifier: string
  title: string
  classification: string[]
  subject: string[]
  session: string
  latestActionDate: string | null
  latestActionDescription: string | null
  openstatesUrl: string
}

function timeAgo(d: string | null): string {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString()
}

export default function StateLegBills({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const [bills, setBills] = useState<StateLegBill[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/states/${stateCode}/state-bills`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d) return
        setBills(d.bills ?? [])
        setConfigured(d.configured ?? false)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [stateCode])

  // Hide the section entirely if OpenStates isn't configured — keeps the page clean
  if (!loading && configured === false) return null

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">{stateName} legislature</h2>
        </div>
        <div className="p-6 text-center">
          <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin inline-block" />
        </div>
      </div>
    )
  }

  if (bills.length === 0) {
    return null
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <Landmark className="w-4 h-4 text-[--accent]" />
        <h2 className="font-display text-sm font-bold text-[--text] flex-1">{stateName} legislature</h2>
        <span className="text-[10px] text-[--text-muted]">Recent state bills</span>
      </div>
      <div className="divide-y divide-[--border]">
        {bills.map(bill => (
          <a
            key={bill.id}
            href={bill.openstatesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="badge bg-[--dark] text-white text-[10px]">{bill.identifier}</span>
                <span className="text-[10px] text-[--text-muted]">{bill.session}</span>
                {bill.subject.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] text-[--text-muted]">· {s}</span>
                ))}
              </div>
              <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors leading-snug line-clamp-2">
                {bill.title}
              </p>
              {bill.latestActionDescription && (
                <p className="text-[11px] text-[--text-muted] line-clamp-1 mt-0.5">
                  {bill.latestActionDescription}
                </p>
              )}
              {bill.latestActionDate && (
                <p className="text-[10px] text-[--text-muted] mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {timeAgo(bill.latestActionDate)}
                </p>
              )}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0 mt-1" />
          </a>
        ))}
      </div>
      <div className="px-5 py-2.5 border-t border-[--border] text-center">
        <a href={`https://openstates.org/${stateCode.toLowerCase()}/bills/`} target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
        >
          Browse all on OpenStates →
        </a>
      </div>
    </div>
  )
}
