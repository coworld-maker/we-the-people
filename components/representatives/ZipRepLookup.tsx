'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Search, ArrowRight, Users, Loader2, AlertCircle } from 'lucide-react'
import { abbrToName } from '@/lib/utils/state-codes'

interface RepResult {
  fullName: string
  party: string
  bioguideId: string
}

interface ZipResponse {
  // No stateName: /api/landing/reps-by-zip returns the 2-letter code only, so
  // the full name comes from abbrToName at render time.
  state?: string
  district?: string
  senators: RepResult[]
  house: RepResult | null
  ambiguous?: boolean
  options?: Array<{ state: string; district: string; senators: RepResult[]; house: RepResult | null }>
  error?: string
}

const PARTY_COLOR: Record<string, string> = {
  R: 'text-red-600',
  D: 'text-blue-600',
  I: 'text-gray-600',
}

const PARTY_LABEL: Record<string, string> = {
  R: 'Republican',
  D: 'Democrat',
  I: 'Independent',
}

function RepCard({ rep, role }: { rep: RepResult; role: string }) {
  return (
    <Link
      href={`/my-representatives/${rep.bioguideId}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-[--border] bg-[--surface] hover:border-[--accent]/40 hover:bg-[--accent]/5 transition-all group"
    >
      <div className="w-9 h-9 rounded-full bg-[--surface-secondary] flex items-center justify-center shrink-0 font-display text-sm font-bold text-[--text-muted] border border-[--border]">
        {rep.fullName.split(' ').map(n => n[0]).slice(-2).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[--text] truncate">{rep.fullName}</p>
        <p className="text-xs text-[--text-muted]">
          {role} · <span className={PARTY_COLOR[rep.party] ?? 'text-[--text-muted]'}>{PARTY_LABEL[rep.party] ?? rep.party}</span>
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-[--text-muted] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

export default function ZipRepLookup() {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ZipResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function lookup(zipVal: string) {
    if (!/^\d{5}$/.test(zipVal)) {
      setError('Enter a valid 5-digit ZIP code.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedOption(null)
    try {
      const res = await fetch(`/api/landing/reps-by-zip?zip=${zipVal}`)
      const data: ZipResponse = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not find representatives for that ZIP.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    lookup(zip.trim())
  }

  // Which set of reps to show — either the top-level result or a chosen option
  const display = selectedOption !== null ? result?.options?.[selectedOption] : result
  const senators = display?.senators ?? []
  const house = display?.house ?? null
  const hasReps = senators.length > 0 || house

  return (
    <div className="space-y-6">
      {/* ZIP input */}
      <form onSubmit={handleSubmit} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Find your representatives</h2>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={zip}
            onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="Enter ZIP code"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[--border] bg-[--surface-secondary] text-sm text-[--text] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent]/40 focus:border-[--accent] transition-colors"
          />
          <button
            type="submit"
            disabled={loading || zip.length !== 5}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[--accent] text-white text-sm font-semibold hover:bg-[--accent-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Look up
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </form>

      {/* Ambiguous ZIP — multiple state/district options */}
      {result?.ambiguous && result.options && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-[--text] mb-1">That ZIP spans multiple districts</p>
          <p className="text-xs text-[--text-muted] mb-4">Pick yours:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(i)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedOption === i
                    ? 'border-[--accent] bg-[--accent]/5 text-[--accent]'
                    : 'border-[--border] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--text]'
                }`}
              >
                {abbrToName(opt.state) ?? opt.state}{opt.district && opt.district !== '0' ? ` – District ${opt.district}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasReps && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[--accent]" />
            <h2 className="font-display text-sm font-bold text-[--text]">
              Your delegation
              {display?.state && (
                <span className="font-normal text-[--text-muted]"> · {abbrToName(display.state) ?? display.state}</span>
              )}
            </h2>
          </div>

          <div className="space-y-2">
            {senators.map(s => (
              <RepCard key={s.bioguideId} rep={s} role="U.S. Senator" />
            ))}
            {house && (
              <RepCard rep={house} role={`U.S. Rep${display?.district && display.district !== '0' ? ` · District ${display.district}` : ''}`} />
            )}
          </div>

          {/* Sign-up CTA */}
          <div className="card p-5 border-[--accent]/20 bg-[--accent]/5 mt-4">
            <p className="text-sm font-semibold text-[--text] mb-1">
              See how you align with your reps
            </p>
            <p className="text-xs text-[--text-muted] mb-4">
              Vote on bills to get a personal alignment score — see where you agree and disagree with each member of Congress.
            </p>
            <div className="flex gap-2">
              <Link
                href="/sign-up"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[--accent] text-white text-xs font-bold hover:bg-[--accent-hover] transition-colors"
              >
                Get started free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[--border] text-xs font-medium text-[--text-secondary] hover:text-[--text] hover:border-[--accent]/40 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* How it works — always shown */}
      <section className="card p-6">
        <h2 className="font-display text-sm font-bold text-[--text] mb-5">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Enter your ZIP', desc: 'We look up your senators and house representative from the current congressional roster.' },
            { step: '02', title: 'Vote on bills', desc: 'Any bill you vote on that also had a recorded congressional roll call vote counts toward your score.' },
            { step: '03', title: 'See your alignment', desc: 'Compare your Yes/No to their Yea/Nay and get a percentage alignment score for each rep.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[--accent] text-white font-display text-xs font-bold rounded-full mb-3">
                {item.step}
              </span>
              <h3 className="font-display text-sm font-bold text-[--text] mb-1">{item.title}</h3>
              <p className="text-xs text-[--text-secondary] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-[--border] text-center">
          <Link href="/sign-up" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
            Create a free account to get your alignment score <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
