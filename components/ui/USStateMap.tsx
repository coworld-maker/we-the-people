'use client'

import { useEffect, useMemo, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

// ── Static maps ──────────────────────────────────────────────────────────────

const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'Washington D.C.', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

const WIDTH = 960
const HEIGHT = 600
const TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

interface StateFeature extends Feature<Geometry, { name?: string }> {
  id: string
}

interface Props {
  selected?: string
  onSelect: (code: string) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function USStateMap({ selected, onSelect }: Props) {
  const [features, setFeatures] = useState<StateFeature[] | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Load TopoJSON once on mount
  useEffect(() => {
    let cancelled = false
    fetch(TOPO_URL)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load map data')
        return r.json()
      })
      .then(topo => {
        if (cancelled) return
        // us-atlas TopoJSON has `states` as the key
        const geo = feature(topo, topo.objects.states) as unknown as FeatureCollection<Geometry, { name?: string }>
        setFeatures(geo.features as StateFeature[])
      })
      .catch(() => !cancelled && setError(true))
    return () => { cancelled = true }
  }, [])

  // Build SVG path generator + per-state path strings, fit to viewBox
  const { paths, labels } = useMemo(() => {
    if (!features) return { paths: [] as Array<{ code: string; d: string }>, labels: [] as Array<{ code: string; x: number; y: number }> }

    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features } as FeatureCollection)
    const pathGen = geoPath(projection)

    const paths: Array<{ code: string; d: string }> = []
    const labels: Array<{ code: string; x: number; y: number }> = []

    for (const f of features) {
      const code = FIPS_TO_STATE[String(f.id).padStart(2, '0')]
      if (!code) continue
      const d = pathGen(f as any)
      if (!d) continue
      paths.push({ code, d })
      const centroid = pathGen.centroid(f as any)
      if (centroid && !isNaN(centroid[0])) {
        labels.push({ code, x: centroid[0], y: centroid[1] })
      }
    }

    return { paths, labels }
  }, [features])

  const activeState = hovered ?? selected ?? null

  // Loading state
  if (!features && !error) {
    return (
      <div className="w-full" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxHeight: 480 }}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Failed to load map data
  if (error) {
    return (
      <div className="w-full p-6 text-center bg-[--surface-secondary] rounded-lg">
        <p className="text-sm text-[--text-muted]">Couldn't load the map. Check your connection and refresh.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        style={{ maxHeight: 480 }}
        aria-label="Interactive US state map"
      >
        {paths.map(({ code, d }) => {
          const isSelected = selected === code
          const isHovered = hovered === code
          return (
            <path
              key={code}
              d={d}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'fill 120ms ease' }}
              fill={
                isSelected
                  ? 'var(--accent)'
                  : isHovered
                  ? 'var(--accent-light)'
                  : 'var(--surface-secondary)'
              }
              stroke="var(--surface)"
              strokeWidth={isSelected ? 1.5 : 0.75}
            >
              <title>{STATE_NAMES[code] ?? code}</title>
            </path>
          )
        })}

        {/* State abbreviation labels (skip very small states to avoid overlap) */}
        {labels
          .filter(l => !['RI','CT','DE','DC','NJ','MA','MD','NH','VT'].includes(l.code))
          .map(({ code, x, y }) => (
            <text
              key={`label-${code}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={600}
              fontFamily="var(--font-display, sans-serif)"
              fill={selected === code ? 'white' : 'var(--text-muted)'}
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {code}
            </text>
          ))}
      </svg>

      <p className="text-center text-xs text-[--text-muted] mt-1 h-5">
        {activeState ? (STATE_NAMES[activeState] ?? activeState) : ''}
      </p>
    </div>
  )
}
