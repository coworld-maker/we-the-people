'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, Loader2, Building2, Scale } from 'lucide-react'

interface RepLite { fullName: string; party: string; bioguideId: string; district?: string }
interface LookupResult { state: string; district: string; senators: RepLite[]; house: RepLite | null }

function partyColor(party: string): string {
  const p = (party || '').toUpperCase()[0]
  if (p === 'R') return 'var(--republican)'
  if (p === 'D') return 'var(--democrat)'
  return 'var(--independent)'
}

export default function CivicHero({ billCount, signedIn }: { billCount: number; signedIn: boolean }) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{5}$/.test(zip)) { setError('Enter a 5-digit ZIP code.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`/api/landing/reps-by-zip?zip=${zip}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed.')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reps: RepLite[] = result ? [...result.senators, ...(result.house ? [result.house] : [])] : []

  return (
    <section className="bg-[--bg] border-b border-[--border]">
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--gold-text] mb-5">
              Independent · nonpartisan · built on Congress.gov data
            </p>
            <h1 className="font-serif text-[2.6rem] sm:text-6xl leading-[1.05] text-[--accent] mb-5">
              Understand. Engage.<br />Make an <span className="text-[--gold-text]">impact</span>.
            </h1>
            <p className="text-lg text-[--text-secondary] leading-relaxed max-w-xl mb-8">
              See the laws being passed, who&apos;s funding them, and how your representatives
              actually vote — then add your voice.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link href={signedIn ? '/dashboard' : '/sign-up'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[--radius] bg-[--accent] text-white font-semibold hover:bg-[--accent-hover] transition-colors">
                {signedIn ? 'Go to dashboard' : 'Get started'} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/bills"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[--radius] border border-[--border-strong] text-[--accent] font-semibold hover:bg-[--surface-secondary] transition-colors">
                Browse bills
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[--text-muted]">
              <span><span className="font-display font-bold text-[--accent]">{billCount.toLocaleString()}</span> bills tracked</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Official Congress.gov data</span>
              <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Independent &amp; nonpartisan</span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="bg-[--surface] rounded-2xl border border-[--border] shadow-[var(--shadow-md)] p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-[--accent] mb-1">Start with your address</h2>
              <p className="text-sm text-[--text-secondary] mb-5">
                Enter your ZIP to see who represents you in Congress right now.
              </p>

              <form onSubmit={lookup} className="flex gap-2 mb-2">
                <input
                  inputMode="numeric" maxLength={5} value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
                  placeholder="ZIP code"
                  className="flex-1 min-w-0 px-4 py-3 rounded-[--radius] border border-[--border-strong] bg-[--surface] text-[--text] placeholder:text-[--text-muted] focus:outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20"
                />
                <button type="submit" disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[--radius] bg-[--accent] text-white font-semibold hover:bg-[--accent-hover] transition-colors disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Find
                </button>
              </form>
              {error && <p className="text-sm text-[--danger] mb-2">{error}</p>}

              {reps.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">
                    Your delegation · {result!.state}{result!.district !== '0' ? `-${result!.district}` : ''}
                  </p>
                  {reps.map(rep => (
                    <Link key={rep.bioguideId}
                      href={signedIn ? `/scorecards/${rep.bioguideId}` : `/sign-up?redirect_url=/scorecards/${rep.bioguideId}`}
                      className="flex items-center gap-3 p-3 rounded-[--radius] bg-[--surface-secondary] hover:bg-[--surface-tertiary] transition-colors group">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: partyColor(rep.party) }} />
                      <span className="flex-1 min-w-0 text-sm font-medium text-[--text] truncate">{rep.fullName}</span>
                      <span className="text-xs text-[--accent] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        See votes <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                  <p className="text-[11px] text-[--text-muted] pt-1">
                    See how each one votes, who funds them, and where you agree.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
