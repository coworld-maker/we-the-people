'use client'

import { useState } from 'react'
import Link from 'next/link'
import RepAvatar from '@/components/ui/RepAvatar'
import KeyLock from '@/components/landing/KeyLock'
import { ArrowRight, Loader2 } from 'lucide-react'

interface RepLite { fullName: string; party: string; bioguideId: string; district?: string }
interface ZipOption { state: string; district: string; senators: RepLite[]; house: RepLite | null }
interface LookupResult {
  zip: string
  state: string | null
  district: string | null
  senators: RepLite[]
  house: RepLite | null
  /** A fifth of ZIPs span several districts — then no single delegation is right. */
  ambiguous: boolean
  /** 109 ZIPs cross a state line, so the senators differ too, not just the House member. */
  crossState: boolean
  options: ZipOption[]
  /** Senators grouped by state — the only labelled form, and the one to use for
   *  a cross-state ZIP where both pairs are legitimately possible. */
  senatorsByState: Array<{ state: string; senators: RepLite[] }>
}

/**
 * "Your ZIP is the key." The visitor's ZIP cuts the key as they type; a
 * successful lookup unlocks the Capitol-dome lock and reveals their delegation.
 * The key only turns on a real answer — a failed lookup leaves it locked.
 */
export default function CivicHero({ billCount, signedIn }: { billCount: number; signedIn: boolean }) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  // Which district the visitor picked when their ZIP spans several.
  const [picked, setPicked] = useState<ZipOption | null>(null)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{5}$/.test(zip)) { setError('Enter all five digits of your ZIP code.'); return }
    setLoading(true); setError(''); setResult(null); setPicked(null)
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

  function onZipChange(value: string) {
    const next = value.replace(/\D/g, '').slice(0, 5)
    setZip(next)
    // Editing the ZIP re-cuts the key, so it backs out of the lock.
    if (result) { setResult(null); setPicked(null) }
    if (error) setError('')
  }

  // An ambiguous ZIP has no correct delegation until the visitor picks a district.
  // Never fall back to options[0] — silently choosing is the bug this replaced.
  const shown: ZipOption | null =
    picked ?? (result && !result.ambiguous
      ? { state: result.state!, district: result.district!, senators: result.senators, house: result.house }
      : null)
  const reps: RepLite[] = shown ? [...shown.senators, ...(shown.house ? [shown.house] : [])] : []
  const needsPick = !!result && result.ambiguous && !picked
  const districtLabel = (o: ZipOption) => o.district === '0' ? `${o.state} at-large` : `${o.state}-${o.district}`
  const repHref = (id: string) => signedIn ? `/scorecards/${id}` : `/sign-up?redirect_url=/scorecards/${id}`

  return (
    <section className="bg-[#0A2463] text-white">
      <div className="max-w-6xl mx-auto px-5 pt-12 pb-14 md:pt-20 md:pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-14 gap-y-8 items-center">

        <div className="min-w-0 lg:col-start-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8B33C] mb-4">
            Independent · nonpartisan · public record
          </p>
          <h1 className="font-serif text-[2.9rem] sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight [text-wrap:balance]">
            Your ZIP is <span className="text-[#C79A3E]">the key.</span>
          </h1>
          <p className="mt-5 text-lg text-[#B7C1D8] leading-relaxed max-w-md">
            Five digits unlock your two senators, your House member, and the roll calls
            they&apos;ve cast, straight from the public record.
          </p>
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <KeyLock zip={zip} unlocked={!!result} className="w-full h-auto max-w-[620px] mx-auto" />
        </div>

        <div className="min-w-0 lg:col-start-1">
          <form onSubmit={lookup} className="flex gap-2 max-w-md">
            <label htmlFor="hero-zip" className="sr-only">ZIP code</label>
            <input
              id="hero-zip" autoComplete="postal-code"
              inputMode="numeric" maxLength={5} value={zip}
              onChange={e => onZipChange(e.target.value)}
              placeholder="Your ZIP code"
              className="flex-1 min-w-0 min-h-[52px] px-4 rounded-lg bg-white text-[#131A2C] text-xl font-mono tracking-[0.18em] placeholder:text-base placeholder:tracking-normal placeholder:font-sans placeholder:text-[#5F6B7E] focus:outline-none focus:ring-[3px] focus:ring-[#E8B33C]"
            />
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-lg bg-[#E8B33C] text-[#1A1405] font-bold hover:bg-[#F2C352] transition-colors disabled:opacity-70">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Unlock
            </button>
          </form>
          <p className="mt-2 text-sm text-[#B7C1D8]" aria-live="polite">
            {error || (result ? '' : 'Each digit cuts one tooth of the key.')}
          </p>

          {/* This ZIP spans several districts, so there is no single right
              answer — ask instead of guessing. 21.6% of ZIPs land here, and
              109 of them cross a state line, which changes the senators too. */}
          {needsPick && (
            <div className="keylock-reveal mt-4 space-y-2 max-w-md" aria-live="polite">
              <p className="font-semibold">
                <span className="font-mono">{result!.zip ?? zip}</span> opens {result!.options.length} doors
              </p>
              <p className="text-sm text-[#B7C1D8]">
                {result!.crossState
                  ? 'It spans districts in more than one state, so your senators depend on which side you live on. Pick the district on your voter card.'
                  : 'It spans several districts. Pick the one on your voter card; we won’t guess.'}
              </p>
              {result!.options.map(o => (
                <button key={`${o.state}-${o.district}`} type="button" onClick={() => setPicked(o)}
                  className="w-full flex items-center gap-3 min-h-[52px] px-4 rounded-lg bg-[#132E73] border border-white/25 hover:border-[#E8B33C] transition-colors text-left">
                  <span className="font-mono text-sm min-w-[56px]">{districtLabel(o)}</span>
                  <span className="flex-1 min-w-0 text-sm text-[#B7C1D8] truncate">
                    {o.house ? o.house.fullName : 'House seat unmatched'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ))}

              {/* Cross-state ZIP: both pairs are genuinely possible, so show
                  both LABELLED rather than picking a state or showing none. */}
              {result!.crossState && result!.senatorsByState?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {result!.senatorsByState.map(group => (
                    <div key={group.state} className="rounded-lg border border-white/20 px-3 py-2.5 text-sm">
                      <p className="font-mono text-[11px] tracking-wider text-[#B7C1D8] mb-1">IF {group.state}</p>
                      {group.senators.map(s => <p key={s.bioguideId}>{s.fullName}</p>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {reps.length > 0 && shown && (
            <div className="keylock-reveal mt-4 space-y-2 max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B7C1D8] flex items-center gap-2">
                Your delegation · {districtLabel(shown)}
                {picked && (
                  <button type="button" onClick={() => setPicked(null)}
                    className="normal-case tracking-normal font-medium text-[#E8B33C] hover:underline min-h-[44px]">
                    change district
                  </button>
                )}
              </p>
              {reps.map(rep => (
                <Link key={rep.bioguideId} href={repHref(rep.bioguideId)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.06] border border-white/15 hover:border-[#E8B33C] transition-colors group">
                  <RepAvatar bioguideId={rep.bioguideId} fullName={rep.fullName} party={rep.party} size="md" />
                  <span className="flex-1 min-w-0 font-medium truncate">{rep.fullName}</span>
                  <span className="text-xs text-[#E8B33C] font-semibold flex items-center gap-1">
                    See votes <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#B7C1D8]">
            <span><span className="font-semibold text-white tabular-nums">{billCount.toLocaleString()}</span> bills tracked · Congress.gov</span>
            <Link href="/bills" className="inline-flex items-center gap-1 min-h-[44px] font-semibold text-white hover:text-[#E8B33C] transition-colors">
              Browse bills <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
