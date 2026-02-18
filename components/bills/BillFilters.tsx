'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

export default function BillFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')

  const applyFilters = useCallback((overrides?: { search?: string; status?: string; year?: string }) => {
    const s = overrides?.search ?? search
    const st = overrides?.status ?? status
    const y = overrides?.year ?? year
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (st) params.set('status', st)
    if (y) params.set('year', y)
    router.push(`/bills${params.toString() ? '?' + params.toString() : ''}`)
  }, [search, status, year, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    applyFilters()
  }

  function handleClear() {
    setSearch('')
    setStatus('')
    setYear('')
    router.push('/bills')
  }

  const hasFilters = search || status || year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i)

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🔍</span>
          <input
            type="text" placeholder="Search bills..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] text-sm text-[#0F172A] placeholder-gray-400 bg-gray-50/50 font-body"
          />
        </div>

        {/* Status */}
        <select value={status}
          onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] text-sm text-[#0F172A] bg-gray-50/50 cursor-pointer font-body"
        >
          <option value="">All Statuses</option>
          <option value="introduced">📌 Introduced</option>
          <option value="in_committee">🔍 In Committee</option>
          <option value="reported">📝 Reported</option>
          <option value="passed_chamber">📋 Passed Chamber</option>
          <option value="passed_both">🏛️ Passed Both</option>
          <option value="enacted">✅ Enacted</option>
        </select>

        {/* Year */}
        <select value={year}
          onChange={(e) => { setYear(e.target.value); applyFilters({ year: e.target.value }) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] text-sm text-[#0F172A] bg-gray-50/50 cursor-pointer font-body"
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        {/* Search button */}
        <button type="submit"
          className="px-6 py-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] font-bold text-sm transition-colors shadow-sm font-display"
        >
          Search
        </button>

        {hasFilters && (
          <button type="button" onClick={handleClear}
            className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-[#0F172A] font-semibold text-sm transition-colors font-body"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </form>
  )
}
