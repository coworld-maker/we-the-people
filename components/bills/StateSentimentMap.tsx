'use client'

import { useEffect, useMemo, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { Users, Info } from 'lucide-react'

// ── Lookup tables (shared shape with USStateMap) ─────────────────────────────

const FIPS_TO_STATE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
}

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DC:'Washington D.C.',DE:'Delaware',
  FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',
  IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
  RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',
  TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

const WIDTH = 960
const HEIGHT = 600
const TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// ── Types ────────────────────────────────────────────────────────────────────

export interface StateBreakdown {
  yes: number
  no: number
  abstain: number
  total: number
}

interface Props {
  byState: Record<string, StateBreakdown>
  totalVotes: number
}

interface StateFeature extends Feature<Geometry, { name?: string }> {
  id: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map yes-share to a color. Below 5 votes we treat as "low confidence". */
function colorFor(b: StateBreakdown | undefined): { fill: string; opacity: number } {
  if (!b || b.total === 0) return { fill: 'var(--surface-tertiary)', opacity: 0.5 }
  const yesShare = b.yes / b.total
  const lowConf = b.total < 5
  const opacity = lowConf ? 0.5 : 1

  if (yesShare >= 0.7) return { fill: '#059669', opacity }   // emerald-600
  if (yesShare >= 0.55) return { fill: '#34d399', opacity }  // emerald-400
  if (yesShare >= 0.45) return { fill: '#94a3b8', opacity }  // slate-400 (split)
  if (yesShare >= 0.3) return { fill: '#fca5a5', opacity }   // red-300
  return { fill: '#dc2626', opacity }                         // red-600
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StateSentimentMap({ byState, totalVotes }: Props) {
  const [features, setFeatures] = useState<StateFeature[] | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(TOPO_URL)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(topo => {
        if (cancelled) return
        const geo = feature(topo, topo.objects.states) as unknown as FeatureCollection<Geometry, { name?: string }>
        setFeatures(geo.features as StateFeature[])
      })
      .catch(() => !cancelled && setError(true))
    return () => { cancelled = true }
  }, [])

  const paths = useMemo(() => {
    if (!features) return [] as Array<{ code: string; d: string }>
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features } as FeatureCollection)
    const pathGen = geoPath(projection)
    const out: Array<{ code: string; d: string }> = []
    for (const f of features) {
      const code = FIPS_TO_STATE[String(f.id).padStart(2, '0')]
      if (!code) continue
      const d = pathGen(f as any)
      if (d) out.push({ code, d })
    }
    return out
  }, [features])

  if (totalVotes === 0) {
    return (
      <div className="p-5 bg-[--surface-secondary] rounded-lg text-center">
        <Users className="w-6 h-6 text-[--text-muted] mx-auto mb-2 opacity-50" />
        <p className="text-xs text-[--text-muted]">
          No citizen votes yet from any state. Once enough people weigh in,
          a sentiment map will appear here.
        </p>
      </div>
    )
  }

  if (error) {
    return <p className="text-xs text-[--text-muted] text-center py-3">Couldn't load sentiment map.</p>
  }

  if (!features) {
    return (
      <div className="w-full flex items-center justify-center" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxHeight: 320 }}>
        <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
      </div>
    )
  }

  const active = hovered ? byState[hovered] : null
  const activeYesPct = active && active.total > 0 ? Math.round((active.yes / active.total) * 100) : 0
  const activeNoPct = active && active.total > 0 ? Math.round((active.no / active.total) * 100) : 0

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        style={{ maxHeight: 320 }}
        aria-label="Citizen vote sentiment by state"
      >
        {paths.map(({ code, d }) => {
          const data = byState[code]
          const { fill, opacity } = colorFor(data)
          const isHovered = hovered === code
          return (
            <path
              key={code}
              d={d}
              fill={fill}
              opacity={isHovered ? Math.min(opacity + 0.1, 1) : opacity}
              stroke="var(--surface)"
              strokeWidth={isHovered ? 1.5 : 0.5}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: data ? 'pointer' : 'default', transition: 'opacity 100ms' }}
            >
              <title>
                {STATE_NAMES[code]}: {data ? `${data.yes}–${data.no}–${data.abstain} (${data.total} votes)` : 'No votes yet'}
              </title>
            </path>
          )
        })}
      </svg>

      {/* Hovered-state breakdown */}
      <div className="min-h-[40px] mt-1 text-center">
        {active ? (
          <p className="text-xs">
            <span className="font-bold text-[--text]">{STATE_NAMES[hovered!]}</span>
            <span className="text-[--text-muted]"> · {active.total} {active.total === 1 ? 'vote' : 'votes'}</span>
            <span className="mx-2 text-[--text-muted]">·</span>
            <span className="text-emerald-600 font-semibold">{activeYesPct}% yes</span>
            <span className="mx-1.5 text-[--text-muted]">/</span>
            <span className="text-red-600 font-semibold">{activeNoPct}% no</span>
            {active.total < 5 && (
              <span className="ml-2 text-[10px] text-[--text-muted] italic">low sample</span>
            )}
          </p>
        ) : (
          <p className="text-[11px] text-[--text-muted] flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> Hover a state to see its breakdown
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-[--text-muted]">
        <span>Strong oppose</span>
        <div className="flex h-2">
          <span style={{ background: '#dc2626' }} className="w-5 h-2" />
          <span style={{ background: '#fca5a5' }} className="w-5 h-2" />
          <span style={{ background: '#94a3b8' }} className="w-5 h-2" />
          <span style={{ background: '#34d399' }} className="w-5 h-2" />
          <span style={{ background: '#059669' }} className="w-5 h-2" />
        </div>
        <span>Strong support</span>
      </div>
    </div>
  )
}
