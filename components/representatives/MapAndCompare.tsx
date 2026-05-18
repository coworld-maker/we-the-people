'use client'

import { useState, useEffect } from 'react'
import USStateMap from '@/components/ui/USStateMap'
import CompareView from './CompareView'
import { MapPin } from 'lucide-react'

const STORAGE_KEY = 'my-reps-state'

export default function MapAndCompare() {
  const [selectedState, setSelectedState] = useState('')

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : ''
    if (saved) setSelectedState(saved)
  }, [])

  function handleSelect(code: string) {
    setSelectedState(code)
    localStorage.setItem(STORAGE_KEY, code)
    // Persist to server for state-level sentiment aggregation (fire-and-forget)
    fetch('/api/user/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: code }),
    }).catch(() => {})
    // Scroll to the results section after a brief tick
    setTimeout(() => {
      document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <>
      {/* Map card */}
      <div id="map" className="card p-5 scroll-mt-20 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Select your state</h2>
          {selectedState && (
            <span className="ml-auto badge bg-[--accent-light] text-[--accent]">
              {selectedState}
            </span>
          )}
        </div>
        <USStateMap selected={selectedState} onSelect={handleSelect} />
      </div>

      {/* Compare results */}
      <div id="compare" className="scroll-mt-20">
        {selectedState ? (
          <CompareView selectedState={selectedState} />
        ) : (
          <div className="card p-10 text-center">
            <MapPin className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-[--text] mb-1">Tap a state on the map</p>
            <p className="text-xs text-[--text-muted]">
              See how your votes align with your representatives' voting records.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
