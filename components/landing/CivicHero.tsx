'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import RepAvatar from '@/components/ui/RepAvatar'
import KeyLock from '@/components/landing/KeyLock'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { RepVote } from '@/lib/data/repVotes'

interface RepLite { fullName: string; party: string; bioguideId: string; district?: string }
type VotesState = { status: 'loading' } | { status: 'error' } | { status: 'done'; votes: Record<string, RepVote[]> }

// Neutral wording only — no party/stance colours on positions.
const POSITION_LABEL: Record<string, string> = { yea: 'Yes', nay: 'No', not_voting: "Didn't vote", present: 'Present' }
const fmtDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Fades results in behind the lock. While the delayed fade is still at
 * opacity 0 the block is `inert`, so Tab can't land on links nobody can see.
 * `inert` also hides it from screen readers, so `onShown` fires once it is
 * reachable — the parent defers the matching announcement and focus until
 * then, so what is spoken and what can be reached arrive together.
 * `immediate` skips the delay (focus is being moved in right away).
 */
function Reveal({ immediate, onShown, className, children }: {
  immediate: boolean; onShown: () => void; className: string; children: React.ReactNode
}) {
  const [hiding, setHiding] = useState(() => !immediate && !prefersReducedMotion())
  // Fallback in case animationend never fires (animations disabled elsewhere).
  useEffect(() => {
    if (!hiding) return
    const t = setTimeout(() => setHiding(false), 1500)
    return () => clearTimeout(t)
  }, [hiding])
  const onShownRef = useRef(onShown)
  onShownRef.current = onShown
  useEffect(() => { if (!hiding) onShownRef.current() }, [hiding])
  return (
    <div className={`${immediate ? 'keylock-reveal-now' : 'keylock-reveal'} ${className}`} inert={hiding}
      onAnimationEnd={e => { if (e.target === e.currentTarget) setHiding(false) }}>
      {children}
    </div>
  )
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
  // Once the visitor has picked, the blocks they move between skip the lock delay.
  const [hasPicked, setHasPicked] = useState(false)
  // The unlock ceremony plays on the first successful lookup of the page view
  // only; after that the lock just shows its state and results skip the delay.
  const [ceremonyDone, setCeremonyDone] = useState(false)
  // Which results block has finished revealing (see Reveal): its announcement
  // waits for it, since screen readers can't reach an `inert` block.
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  // Focus targets: picking unmounts the focused button, so focus is placed explicitly.
  const zipInputRef = useRef<HTMLInputElement>(null)
  const delegationHeadingRef = useRef<HTMLSpanElement>(null)
  const optionsHeadingRef = useRef<HTMLParagraphElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  // Placed once the target's Reveal is reachable.
  const focusOnReveal = useRef<'delegation' | 'optionsHeading' | 'options' | null>(null)
  // Set on a successful ZIP lookup: dismiss the keyboard, bring results into view.
  const scrollToResults = useRef(false)
  // "Not sure which?" street-address lookup. The address lives only in this
  // component state: sent once in a POST body, never stored or put in a URL.
  const [addrOpen, setAddrOpen] = useState(false)
  const [street, setStreet] = useState('')
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrMsg, setAddrMsg] = useState('')
  const streetRef = useRef<HTMLInputElement>(null)

  function resetAddress() {
    setAddrOpen(false); setStreet(''); setAddrLoading(false); setAddrMsg('')
  }

  useEffect(() => { if (addrOpen) streetRef.current?.focus() }, [addrOpen])

  async function findByAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!result || addrLoading) return
    const s = street.trim()
    if (!s) { setAddrMsg('Enter your street address, like 601 Broad St.'); streetRef.current?.focus(); return }
    setAddrLoading(true); setAddrMsg('')
    try {
      const res = await fetch('/api/landing/district-by-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street: s.slice(0, 200), zip: result.zip ?? zip }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Address lookup failed. Pick your district above.')
      const match = result.options.find(o => o.state === data.state && o.district === data.district)
      if (match) {
        resetAddress()
        pickDistrict(match)
      } else {
        const label = data.district === '0' ? `${data.state} at-large` : `${data.state}-${data.district}`
        setAddrMsg(`That address is in ${label}, which isn't one of the districts listed for this ZIP. Double-check your ZIP, or pick the district on your voter card.`)
      }
    } catch (err: any) {
      setAddrMsg(err.message)
    } finally {
      setAddrLoading(false)
    }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    // The button stays enabled while loading (disabling it drops focus to
    // <body> in Safari/Firefox), so repeat submits are ignored here instead.
    if (loading) return
    if (!/^\d{5}$/.test(zip)) { setError('Enter all five digits of your ZIP code.'); return }
    setLoading(true); setError(''); setResult(null); setPicked(null); setHasPicked(false); resetAddress()
    setRevealedKey(null)
    try {
      const res = await fetch(`/api/landing/reps-by-zip?zip=${zip}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed.')
      focusOnReveal.current = data.ambiguous ? 'optionsHeading' : 'delegation'
      scrollToResults.current = true
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
    if (result) { setResult(null); setPicked(null); setHasPicked(false); resetAddress() }
    if (error) setError('')
  }

  function pickDistrict(o: ZipOption | null) {
    focusOnReveal.current = o ? 'delegation' : 'options'
    setHasPicked(true)
    setPicked(o)
  }

  // A Reveal became reachable: let its announcement through and place any
  // focus that was waiting on it (focusing inside an `inert` block fails).
  function onRevealed(key: string, target: 'delegation' | 'options') {
    setRevealedKey(key)
    // Anything after the first reveal skips the ceremony.
    setCeremonyDone(true)
    const want = focusOnReveal.current
    if (!want) return
    const el = target === 'delegation'
      ? (want === 'delegation' ? delegationHeadingRef.current : null)
      : want === 'optionsHeading' ? optionsHeadingRef.current
      : want === 'options' ? firstOptionRef.current : null
    if (!el) return
    focusOnReveal.current = null
    el.focus({ preventScroll: true })
  }

  // After a successful lookup: dismiss the phone keyboard and bring the
  // results heading into view (it clears the sticky header via scroll-mt).
  useEffect(() => {
    if (!result || !scrollToResults.current) return
    scrollToResults.current = false
    zipInputRef.current?.blur()
    const heading = result.ambiguous ? optionsHeadingRef.current : delegationHeadingRef.current
    if (!heading) return
    // Skip the jump when the heading is already comfortably on screen (wide
    // layouts): scrolling there would carry the lock out of view mid-unlock.
    const r = heading.getBoundingClientRect()
    if (r.top >= 96 && r.bottom <= window.innerHeight - 120) return
    heading.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [result])

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

  // Latest votes on bills for whichever delegation is shown. Keyed on the ids
  // so re-renders don't refetch; a changed delegation aborts the old request.
  // Deliberately not announced: the delegation announcement already fires.
  const repIds = reps.map(r => r.bioguideId).join(',')
  const [votesState, setVotesState] = useState<VotesState | null>(null)
  useEffect(() => {
    if (!repIds) { setVotesState(null); return }
    const ctrl = new AbortController()
    setVotesState({ status: 'loading' })
    fetch(`/api/landing/rep-votes?ids=${encodeURIComponent(repIds)}`, { signal: ctrl.signal })
      .then(async res => {
        const data = await res.json().catch(() => null)
        if (!res.ok || !data || typeof data.votes !== 'object') throw new Error('bad response')
        setVotesState({ status: 'done', votes: data.votes })
      })
      .catch(() => { if (!ctrl.signal.aborted) setVotesState({ status: 'error' }) })
    return () => ctrl.abort()
  }, [repIds])

  const mostRecentBillId = (() => {
    if (votesState?.status !== 'done') return null
    const all = Object.values(votesState.votes).flat().filter(v => v.votedAt)
    all.sort((a, b) => b.votedAt!.localeCompare(a.votedAt!))
    return all[0]?.billId ?? Object.values(votesState.votes).flat()[0]?.billId ?? null
  })()
  const billCtaHref = (billId: string) => signedIn ? `/bills/${billId}` : `/sign-up?redirect_url=/bills/${billId}`

  // Identify the results block on screen, so its announcement can wait for it.
  const resultZip = result?.zip ?? zip
  const pickKey = `pick:${resultZip}`
  const delegationKey = shown ? `delegation:${resultZip}:${districtLabel(shown)}` : ''
  // Later lookups and district switches skip the lock's delay.
  const revealNow = hasPicked || ceremonyDone

  // The one live region. The visible hint blanks on success and the lock's
  // aria-label isn't announced, so every outcome is spoken from here. Results
  // are announced once their block is reachable (not while it is `inert`).
  const status = loading ? `Looking up ZIP ${zip}…`
    : error ? error
    : needsPick && addrLoading ? 'Finding your district from your address…'
    : needsPick && addrMsg ? addrMsg
    : needsPick ? (revealedKey === pickKey
      ? `ZIP ${resultZip} spans ${result!.options.length} districts. Choose yours below.` : '')
    : shown ? (reps.length > 0
      ? (revealedKey === delegationKey
        ? `Your delegation for ${districtLabel(shown)}: ${reps.map(r => r.fullName).join(', ')}.` : '')
      : `No members of Congress found for ${districtLabel(shown)}.`)
    : ''

  return (
    <section className="bg-[#0A2463] text-white">
      <div className="max-w-6xl mx-auto px-5 pt-12 pb-14 md:pt-20 md:pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-14 gap-y-8 items-center">

        <div className="min-w-0 lg:col-start-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8B33C] mb-4">
            Independent · nonpartisan · public record
          </p>
          {/* text-white is explicit: the global h1 rule sets ink colour, which vanished on navy. */}
          <h1 className="font-serif text-white text-[2.9rem] sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight [text-wrap:balance]">
            See what <span className="text-[#C79A3E]">Congress</span> is doing.
          </h1>
          <p className="mt-5 text-lg text-[#B7C1D8] leading-relaxed max-w-md">
            Enter your ZIP to see your two senators and your House member, and how
            they&apos;ve voted, straight from the public record.
          </p>
        </div>

        {/* Top-aligned beside the headline; centring it across both rows left
            it floating low once the district list opened below the form. */}
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:pt-10">
          {/* 'turning' starts the key's single travel the moment the form is
              submitted; the lookup lands while it moves and the shackle lifts
              as it seats. After the first unlock the lock just shows its state. */}
          <KeyLock zip={zip}
            state={result ? 'unlocked' : loading && !ceremonyDone ? 'turning' : 'idle'}
            ambiguous={!!result?.ambiguous} instant={ceremonyDone}
            className="w-full h-auto max-w-[620px] mx-auto" />
        </div>

        <div className="min-w-0 lg:col-start-1">
          <p role="status" className="sr-only">{status}</p>
          <form onSubmit={lookup} aria-busy={loading} className="flex gap-2 max-w-md">
            <label htmlFor="hero-zip" className="sr-only">ZIP code</label>
            <input
              id="hero-zip" ref={zipInputRef} autoComplete="postal-code"
              inputMode="numeric" maxLength={5} value={zip}
              onChange={e => onZipChange(e.target.value)}
              aria-invalid={!!error} aria-describedby="hero-zip-hint"
              placeholder="Your ZIP code"
              className="flex-1 min-w-0 min-h-[52px] px-4 rounded-lg bg-white text-[#131A2C] text-xl font-mono tracking-[0.18em] placeholder:text-base placeholder:tracking-normal placeholder:font-sans placeholder:text-[#5F6B7E] focus:outline-none focus:ring-[3px] focus:ring-[#E8B33C]"
            />
            {/* aria-disabled, not disabled: a disabled button drops focus to
                <body> in Safari/Firefox. lookup() ignores repeat submits. */}
            <button type="submit" aria-disabled={loading}
              className={`inline-flex items-center gap-2 min-h-[52px] px-6 rounded-lg bg-[#E8B33C] text-[#1A1405] font-bold hover:bg-[#F2C352] transition-colors ${loading ? 'opacity-70 cursor-wait' : ''}`}>
              {loading && <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin" />}
              Find my reps
            </button>
          </form>
          {/* Announced via the status region above, so no aria-live here.
              #FFB4A8 on the navy is 8.5:1. */}
          <p id="hero-zip-hint" className={`mt-2 text-sm ${error ? 'text-[#FFB4A8]' : 'text-[#B7C1D8]'}`}>
            {error || (result ? '' : 'Type your ZIP to unlock your delegation.')}
          </p>

          {/* This ZIP spans several districts, so there is no single right
              answer — ask instead of guessing. 21.6% of ZIPs land here, and
              109 of them cross a state line, which changes the senators too. */}
          {needsPick && (
            <Reveal key={pickKey} immediate={revealNow} onShown={() => onRevealed(pickKey, 'options')}
              className="mt-4 space-y-2 max-w-md">
              <p ref={optionsHeadingRef} tabIndex={-1} className="font-semibold scroll-mt-24 focus:outline-none">
                <span className="font-mono">{result!.zip ?? zip}</span> opens {result!.options.length} doors
              </p>
              <p className="text-sm text-[#B7C1D8]">
                {result!.crossState
                  ? 'It spans districts in more than one state, so your senators depend on which side you live on. Pick the district on your voter card.'
                  : 'It spans several districts. Pick the one on your voter card; we won’t guess.'}
              </p>
              {result!.options.map((o, i) => (
                <button key={`${o.state}-${o.district}`} type="button" onClick={() => pickDistrict(o)}
                  ref={i === 0 ? firstOptionRef : undefined}
                  className="w-full flex items-center gap-3 min-h-[52px] px-4 rounded-lg bg-[#132E73] border border-white/25 hover:border-[#E8B33C] transition-colors text-left">
                  <span className="font-mono text-sm min-w-[56px]">{districtLabel(o)}</span>
                  <span className="flex-1 min-w-0 text-sm text-[#B7C1D8] truncate">
                    {o.house ? o.house.fullName : 'House seat unmatched'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              ))}

              {/* Don't know your district? Resolve it from a street address via
                  the Census geocoder, then pick it exactly as a click would. */}
              <div className="pt-1">
                {!addrOpen ? (
                  <button type="button" onClick={() => { setAddrOpen(true); setAddrMsg('') }}
                    aria-expanded={false} aria-controls="hero-addr-panel"
                    className="min-h-[44px] text-sm font-medium text-[#E8B33C] hover:underline">
                    Not sure which? Use your street address
                  </button>
                ) : (
                  <form id="hero-addr-panel" onSubmit={findByAddress} aria-busy={addrLoading}
                    className="rounded-lg border border-white/20 p-3 space-y-2">
                    <label htmlFor="hero-street" className="block text-sm font-semibold">Street address</label>
                    <div className="flex gap-2">
                      <input
                        id="hero-street" ref={streetRef} autoComplete="street-address"
                        maxLength={200} value={street}
                        onChange={e => { setStreet(e.target.value); if (addrMsg) setAddrMsg('') }}
                        aria-invalid={!!addrMsg} aria-describedby="hero-street-hint"
                        placeholder="e.g. 601 Broad St"
                        className="flex-1 min-w-0 min-h-[48px] px-3 rounded-lg bg-white text-[#131A2C] placeholder:text-[#5F6B7E] focus:outline-none focus:ring-[3px] focus:ring-[#E8B33C]"
                      />
                      <button type="submit" aria-disabled={addrLoading}
                        className={`inline-flex items-center gap-2 min-h-[48px] px-4 rounded-lg bg-[#E8B33C] text-[#1A1405] font-bold text-sm hover:bg-[#F2C352] transition-colors ${addrLoading ? 'opacity-70 cursor-wait' : ''}`}>
                        {addrLoading && <Loader2 aria-hidden="true" className="w-4 h-4 motion-safe:animate-spin" />}
                        Find my district
                      </button>
                    </div>
                    {/* Announced via the status region, so no aria-live here. */}
                    <p id="hero-street-hint" className={`text-xs ${addrMsg ? 'text-[#FFB4A8]' : 'text-[#B7C1D8]'}`}>
                      {addrMsg || `ZIP ${result!.zip ?? zip}. Used once to find your district, never stored.`}
                    </p>
                  </form>
                )}
                <a href="https://www.house.gov/representatives/find-your-representative"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center min-h-[44px] text-sm text-[#B7C1D8] underline hover:text-white">
                  Or look it up on house.gov<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>

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
            </Reveal>
          )}

          {reps.length > 0 && shown && (
            <Reveal key={delegationKey} immediate={revealNow} onShown={() => onRevealed(delegationKey, 'delegation')}
              className="mt-4 space-y-2 max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B7C1D8] flex items-center gap-2">
                <span ref={delegationHeadingRef} tabIndex={-1} role="heading" aria-level={2} className="scroll-mt-24 focus:outline-none">
                  Your delegation · {districtLabel(shown)}
                </span>
                {picked && (
                  <button type="button" onClick={() => pickDistrict(null)}
                    className="normal-case tracking-normal font-medium text-[#E8B33C] hover:underline min-h-[44px]">
                    change district
                  </button>
                )}
              </p>
              <p className="text-[11px] text-[#B7C1D8]">
                Latest votes on bills · House Clerk / senate.gov
              </p>
              {reps.map(rep => {
                const list = votesState?.status === 'done' ? votesState.votes[rep.bioguideId] ?? [] : null
                return (
                  <div key={rep.bioguideId} className="rounded-lg bg-white/[0.06] border border-white/15">
                    <Link href={repHref(rep.bioguideId)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
                      <RepAvatar bioguideId={rep.bioguideId} fullName={rep.fullName} party={rep.party} size="md" />
                      <span className="flex-1 min-w-0 font-medium truncate">{rep.fullName}</span>
                      <span className="text-xs text-[#E8B33C] font-semibold flex items-center gap-1">
                        See votes <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                    <div className="px-3 pb-2 border-t border-white/10">
                      {votesState?.status === 'loading' && (
                        <p className="py-2 text-xs text-[#B7C1D8]">Loading votes…</p>
                      )}
                      {votesState?.status === 'error' && (
                        <p className="py-2 text-xs text-[#B7C1D8]">Couldn&apos;t load votes right now.</p>
                      )}
                      {list && list.length === 0 && (
                        <p className="py-2 text-xs text-[#B7C1D8]">No recorded votes on bills yet.</p>
                      )}
                      {list && list.length > 0 && (
                        <ul aria-label={`${rep.fullName}'s latest votes on bills`} className="divide-y divide-white/10">
                          {list.map(v => {
                            const label = (v.position && POSITION_LABEL[v.position]) || 'Position not recorded'
                            const date = fmtDate(v.votedAt)
                            return (
                              <li key={v.billId} className="py-1 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 min-w-[5.5rem] pt-3 text-xs font-semibold text-white">{label}</span>
                                  <Link href={`/bills/${v.billId}`}
                                    className="flex-1 min-w-0 min-h-[44px] py-2.5 text-[#B7C1D8] hover:text-white">
                                    <span className="font-mono text-xs text-white">{v.code}</span>
                                    {v.title && <span className="block truncate">{v.title}</span>}
                                  </Link>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 pl-[6rem] text-xs text-[#B7C1D8]">
                                  {date && <span>{date}</span>}
                                  {v.sourceUrl && (
                                    <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center min-h-[44px] underline hover:text-white">
                                      Official record<span className="sr-only"> (opens in a new tab)</span>
                                    </a>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
              {mostRecentBillId && (
                <Link href={billCtaHref(mostRecentBillId)}
                  className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold text-[#E8B33C] hover:underline">
                  Vote on these bills yourself <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </Reveal>
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
