'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

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

  // Generate year options (2023-2026)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i)

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-md mb-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-semibold text-gray-700">Filter Bills</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-400 bg-gray-50"
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            applyFilters({ status: e.target.value })
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-gray-50 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="introduced">Introduced</option>
          <option value="in_committee">In Committee</option>
          <option value="reported">Reported</option>
          <option value="passed_chamber">Passed Chamber</option>
          <option value="passed_both">Passed Both</option>
          <option value="enacted">Enacted</option>
        </select>

        {/* Year filter */}
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value)
            applyFilters({ year: e.target.value })
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-gray-50 cursor-pointer"
        >
          <option value="">All Years</option>
          {years.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        {/* Search button */}
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm"
        >
          Search
        </button>

        {/* Clear button */}
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </form>
  )
}
