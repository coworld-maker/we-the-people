'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react'

// ── Interest config ──────────────────────────────────────────────────────────

interface Interest {
  label: string       // display name
  area: string        // must match Bill.policyArea in DB
  emoji: string
}

const INTERESTS: Interest[] = [
  { label: 'Health',        area: 'Health',                                    emoji: '🏥' },
  { label: 'Education',     area: 'Education',                                 emoji: '📚' },
  { label: 'Economy',       area: 'Economics and Public Finance',              emoji: '💰' },
  { label: 'Environment',   area: 'Environmental Protection',                  emoji: '🌿' },
  { label: 'Defense',       area: 'Armed Forces and National Security',        emoji: '🛡️' },
  { label: 'Immigration',   area: 'Immigration',                               emoji: '🌍' },
  { label: 'Justice',       area: 'Crime and Law Enforcement',                 emoji: '⚖️' },
  { label: 'Infrastructure',area: 'Transportation and Public Works',           emoji: '🛣️' },
  { label: 'Technology',    area: 'Science, Technology, Communications',       emoji: '🔬' },
  { label: 'Labor',         area: 'Labor and Employment',                      emoji: '💼' },
  { label: 'Housing',       area: 'Housing and Community Development',         emoji: '🏘️' },
  { label: 'Foreign Policy',area: 'International Affairs',                     emoji: '🌐' },
]

const STORAGE_KEY = 'user_interests'

// ── Bill type ────────────────────────────────────────────────────────────────

interface Bill {
  id: string
  title: string
  shortTitle: string | null
  billType: string
  billNumber: string
  status: string
  policyArea: string | null
  _count: { votes: number }
}

const STATUS_CLS: Record<string, string> = {
  enacted:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  passed_both:    'bg-green-50 text-green-700 border-green-200',
  passed_chamber: 'bg-amber-50 text-amber-700 border-amber-200',
  reported:       'bg-blue-50 text-blue-700 border-blue-200',
  in_committee:   'bg-orange-50 text-orange-700 border-orange-200',
  introduced:     'bg-[--surface-secondary] text-[--text-muted] border-[--border]',
}

function statusLabel(s: string) {
  const labels: Record<string, string> = {
    enacted: 'Enacted', passed_both: 'Passed Both', passed_chamber: 'Passed Chamber',
    reported: 'Reported', in_committee: 'In Committee', introduced: 'Introduced',
  }
  return labels[s] ?? s.replace(/_/g, ' ')
}

// ── Poll card ────────────────────────────────────────────────────────────────

function PollCard({ onSave }: { onSave: (labels: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([])

  function toggle(label: string) {
    setPicked(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label])
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-[--accent] px-5 py-3.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white" />
        <h3 className="font-display text-sm font-bold text-white">What issues matter to you?</h3>
      </div>
      <div className="p-5">
        <p className="text-xs text-[--text-secondary] mb-4 leading-relaxed">
          Pick the topics you care about — we'll surface relevant bills for you.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {INTERESTS.map(i => {
            const active = picked.includes(i.label)
            return (
              <button
                key={i.label}
                onClick={() => toggle(i.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-[--accent] text-white border-[--accent] shadow-sm shadow-[--accent]/20'
                    : 'bg-[--surface-secondary] text-[--text-secondary] border-[--border] hover:border-[--accent]/40 hover:text-[--accent]'
                }`}
              >
                <span>{i.emoji}</span> {i.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => picked.length > 0 && onSave(picked)}
            disabled={picked.length === 0}
            className="btn-primary text-sm px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Show my bills <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSave([])}
            className="text-xs text-[--text-muted] hover:text-[--text] transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bills list ───────────────────────────────────────────────────────────────

function BillsList({
  interests,
  onReset,
}: {
  interests: string[]
  onReset: () => void
}) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const areas = interests
      .map(label => INTERESTS.find(i => i.label === label)?.area)
      .filter(Boolean) as string[]

    if (areas.length === 0) { setLoading(false); return }

    fetch(`/api/bills/recommended?areas=${encodeURIComponent(areas.join(','))}&limit=6`)
      .then(r => r.json())
      .then(d => setBills(d.bills ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [interests])

  const chips = interests.slice(0, 4)
  const extra = interests.length - chips.length

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[--border] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">Recommended for you</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--accent] transition-colors"
          title="Update interests"
        >
          <RefreshCw className="w-3 h-3" /> Update
        </button>
      </div>

      {/* Interest chips */}
      <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
        {chips.map(label => {
          const int = INTERESTS.find(i => i.label === label)
          return (
            <span key={label} className="badge bg-[--accent-light] text-[--accent] text-[10px]">
              {int?.emoji} {label}
            </span>
          )
        })}
        {extra > 0 && (
          <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-[10px]">
            +{extra} more
          </span>
        )}
      </div>

      {/* Bills */}
      {loading ? (
        <div className="p-8 text-center">
          <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin inline-block" />
          <p className="text-xs text-[--text-muted] mt-2">Finding bills…</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-[--text-muted]">No bills found for your interests yet.</p>
          <Link href="/bills" className="text-xs text-[--accent] font-semibold mt-2 inline-block hover:text-[--accent-hover] transition-colors">
            Browse all bills
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[--border]">
          {bills.map(bill => {
            const cls = STATUS_CLS[bill.status] || STATUS_CLS.introduced
            return (
              <Link key={bill.id} href={`/bills/${bill.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="badge bg-[--dark] text-white text-[10px]">{bill.billType} {bill.billNumber}</span>
                    <span className={`badge border text-[10px] ${cls}`}>{statusLabel(bill.status)}</span>
                  </div>
                  <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors leading-snug line-clamp-2">
                    {bill.shortTitle || bill.title}
                  </p>
                  {bill._count.votes > 0 && (
                    <p className="text-[10px] text-[--text-muted] mt-0.5">{bill._count.votes} citizen votes</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      <div className="px-5 py-3 border-t border-[--border]">
        <Link href="/bills" className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
          Browse all bills →
        </Link>
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function PersonalizedBills() {
  const [loaded, setLoaded] = useState(false)
  const [interests, setInterests] = useState<string[]>([])
  const [skipped, setSkipped] = useState(false)

  // Read localStorage once on mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) setSkipped(true)
          else setInterests(parsed)
        }
      }
    } catch {}
    setLoaded(true)
  }, [])

  function handleSave(labels: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels))
    if (labels.length === 0) {
      setSkipped(true)
      setInterests([])
    } else {
      setSkipped(false)
      setInterests(labels)
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    setInterests([])
    setSkipped(false)
  }

  // Avoid flash of poll before localStorage is read
  if (!loaded) return null

  // User explicitly skipped — don't show anything
  if (skipped) return null

  // Interests saved → show recommended bills
  if (interests.length > 0) {
    return <BillsList interests={interests} onReset={handleReset} />
  }

  // No interests yet → show poll
  return <PollCard onSave={handleSave} />
}
