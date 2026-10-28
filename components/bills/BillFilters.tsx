'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search, X, MapPin, Users, Check, SlidersHorizontal, ChevronDown } from 'lucide-react'

interface Props {
  policyAreas: string[]
  userState: string | null
  // /bills is public; "voted by me" and the state filters need an account.
  signedIn: boolean
}

const VOTED_OPTIONS = [
  { value: '',    label: 'All bills' },
  { value: 'yes', label: 'Voted by me' },
  { value: 'no',  label: 'Not voted yet' },
] as const

export default function BillFilters({ policyAreas, userState, signedIn }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch]             = useState(searchParams.get('search') || '')
  const [status, setStatus]             = useState(searchParams.get('status') || '')
  const [year, setYear]                 = useState(searchParams.get('year') || '')
  const [policyArea, setPolicyArea]     = useState(searchParams.get('policyArea') || '')
  const [affectsState, setAffectsState] = useState(searchParams.get('affectsState') === '1')
  const [votedInState, setVotedInState] = useState(searchParams.get('votedInState') === '1')
  const [voted, setVoted]               = useState(searchParams.get('voted') || '')

  const apply = useCallback((overrides?: Partial<{
    search: string; status: string; year: string; policyArea: string;
    affectsState: boolean; votedInState: boolean; voted: string;
  }>) => {
    const p = new URLSearchParams()
    const s   = overrides?.search       ?? search
    const st  = overrides?.status       ?? status
    const y   = overrides?.year         ?? year
    const pa  = overrides?.policyArea   ?? policyArea
    const af  = overrides?.affectsState ?? affectsState
    const vis = overrides?.votedInState ?? votedInState
    const v   = overrides?.voted        ?? voted

    if (s)   p.set('search', s)
    if (st)  p.set('status', st)
    if (y)   p.set('year', y)
    if (pa)  p.set('policyArea', pa)
    if (af)  p.set('affectsState', '1')
    if (vis) p.set('votedInState', '1')
    if (v)   p.set('voted', v)
    router.push(`/bills${p.toString() ? '?' + p.toString() : ''}`)
  }, [search, status, year, policyArea, affectsState, votedInState, voted, router])

  const hasFilters = search || status || year || policyArea || affectsState || votedInState || voted

  // On a phone the dropdowns and state chips pushed the first bill off the
  // screen — three rows of controls before any content. They collapse behind
  // one button on mobile and stay open on desktop, where there's room.
  const [showFilters, setShowFilters] = useState(false)
  const activeCount =
    [status, year, policyArea, voted].filter(Boolean).length +
    (affectsState ? 1 : 0) +
    (votedInState ? 1 : 0)
  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

  return (
    <form onSubmit={e => { e.preventDefault(); apply() }} className="mb-6 space-y-3">
      {/* Row 1 — Search */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-muted]" />
          <input
            type="text"
            placeholder="Search bills…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] placeholder-[--text-muted] bg-[--surface] focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
          />
        </div>
        <button type="submit" className="btn-primary text-xs px-4 py-2">Search</button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch(''); setStatus(''); setYear(''); setPolicyArea('')
              setAffectsState(false); setVotedInState(false); setVoted('')
              router.push('/bills')
            }}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Mobile only: one button instead of three rows of controls. */}
      <button
        type="button"
        onClick={() => setShowFilters(v => !v)}
        aria-expanded={showFilters}
        aria-controls="bill-filter-controls"
        className="sm:hidden w-full min-h-[44px] flex items-center justify-between px-3 py-2 border border-[--border] rounded-lg text-sm font-medium text-[--text] bg-[--surface]"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[--text-muted]" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[--accent] text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[--text-muted] transition-transform ${showFilters ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        id="bill-filter-controls"
        className={`${showFilters ? 'block' : 'hidden'} sm:block space-y-3`}
      >
      {/* Row 2 — Dropdowns */}
      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }) }}
          className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-[--surface] cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
        >
          <option value="">All statuses</option>
          <option value="introduced">Introduced</option>
          <option value="in_committee">In Committee</option>
          <option value="reported">Reported</option>
          <option value="passed_chamber">Passed Chamber</option>
          <option value="passed_both">Passed Both</option>
          <option value="enacted">Enacted</option>
        </select>

        <select
          value={year}
          onChange={e => { setYear(e.target.value); apply({ year: e.target.value }) }}
          className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-[--surface] cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
        >
          <option value="">All years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        <select
          value={policyArea}
          onChange={e => { setPolicyArea(e.target.value); apply({ policyArea: e.target.value }) }}
          className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-[--surface] cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none max-w-[220px] truncate"
        >
          <option value="">All policy areas</option>
          {policyAreas.map(pa => <option key={pa} value={pa}>{pa}</option>)}
        </select>

        {signedIn && (
          <select
            value={voted}
            onChange={e => { setVoted(e.target.value); apply({ voted: e.target.value }) }}
            className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-[--surface] cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
          >
            {VOTED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {/* Row 3 — State-aware toggle chips */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleChip
          active={affectsState}
          disabled={!userState}
          onToggle={() => {
            const next = !affectsState
            setAffectsState(next); apply({ affectsState: next })
          }}
          icon={<MapPin className="w-3 h-3" />}
          label={userState ? `Affects ${userState}` : 'Affects my state'}
          activeCls="bg-orange-50 text-orange-700 border-orange-300"
        />
        <ToggleChip
          active={votedInState}
          disabled={!userState}
          onToggle={() => {
            const next = !votedInState
            setVotedInState(next); apply({ votedInState: next })
          }}
          icon={<Users className="w-3 h-3" />}
          label={userState ? `Voted on by ${userState}` : 'Voted on by my state'}
          activeCls="bg-[--accent-light] text-[--accent] border-[--accent]/40"
        />
        {!signedIn ? (
          <p className="text-[10px] text-[--text-muted] italic">
            <a href="/sign-in?redirect_url=%2Fbills" className="underline">Sign in</a> to filter by your state and your votes.
          </p>
        ) : !userState && (
          <p className="text-[10px] text-[--text-muted] italic">
            Pick your state on the <a href="/my-representatives" className="underline">map</a> to enable state filters.
          </p>
        )}
      </div>
      </div>
    </form>
  )
}

// ── Toggle chip ──────────────────────────────────────────────────────────────

interface ChipProps {
  active: boolean
  disabled?: boolean
  onToggle: () => void
  icon: React.ReactNode
  label: string
  activeCls: string
}

function ToggleChip({ active, disabled, onToggle, icon, label, activeCls }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        disabled
          ? 'bg-[--surface-secondary] text-[--text-muted] border-[--border] opacity-50 cursor-not-allowed'
          : active
          ? `${activeCls} cursor-pointer`
          : 'bg-[--surface] text-[--text-secondary] border-[--border] hover:bg-[--surface-secondary] cursor-pointer'
      }`}
    >
      {active && <Check className="w-3 h-3" />}
      {icon}
      {label}
    </button>
  )
}
