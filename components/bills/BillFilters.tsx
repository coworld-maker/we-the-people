'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'

export default function BillFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')

  const apply = useCallback((o?: { search?: string; status?: string; year?: string }) => {
    const p = new URLSearchParams()
    const s = o?.search ?? search; const st = o?.status ?? status; const y = o?.year ?? year
    if (s) p.set('search', s); if (st) p.set('status', st); if (y) p.set('year', y)
    router.push(`/bills${p.toString() ? '?' + p.toString() : ''}`)
  }, [search, status, year, router])

  const hasFilters = search || status || year
  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

  return (
    <form onSubmit={e => { e.preventDefault(); apply() }} className="flex flex-wrap gap-2 mb-6">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-muted]" />
        <input type="text" placeholder="Search bills..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] placeholder-[--text-muted] bg-white focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
        />
      </div>
      <select value={status} onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }) }}
        className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-white cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
      >
        <option value="">All statuses</option>
        <option value="introduced">Introduced</option>
        <option value="in_committee">In Committee</option>
        <option value="reported">Reported</option>
        <option value="passed_chamber">Passed Chamber</option>
        <option value="passed_both">Passed Both</option>
        <option value="enacted">Enacted</option>
      </select>
      <select value={year} onChange={e => { setYear(e.target.value); apply({ year: e.target.value }) }}
        className="px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-white cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
      >
        <option value="">All years</option>
        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
      <button type="submit" className="btn-primary text-xs px-4 py-2">Search</button>
      {hasFilters && (
        <button type="button" onClick={() => { setSearch(''); setStatus(''); setYear(''); router.push('/bills') }}
          className="btn-secondary text-xs px-3 py-2"><X className="w-3 h-3" /> Clear</button>
      )}
    </form>
  )
}
