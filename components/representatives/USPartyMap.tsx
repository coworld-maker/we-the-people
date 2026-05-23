'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { Map as MapIcon, Users, Info } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const WIDTH = 960
const HEIGHT = 600
const STATE_TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// District boundaries — 119th-Congress GeoJSON, simplified to ~1.2 MB via
// scripts/build-district-geo.py (Jeffrey Lewis dataset, CC0 / public domain).
// The fetcher below accepts BOTH a plain FeatureCollection (current) and a
// TopoJSON-shaped object so future rebuilds at higher fidelity can ship
// either format without code changes.
const DISTRICT_GEO_URL = '/data/us-cd-119.geojson'

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

// ── Types ────────────────────────────────────────────────────────────────────

interface StateEntry {
  house: { D: number; R: number; I: number; total: number }
  senate: { D: number; R: number; I: number; total: number }
  houseShareD: number
  senateShareD: number
}

interface DistrictRow {
  state: string
  district: string
  party: 'D' | 'R' | 'I'
  bioguideId: string
  fullName: string
}

interface PartyMakeup {
  states: Record<string, StateEntry>
  districts: DistrictRow[]
}

// ── Color helpers ────────────────────────────────────────────────────────────

/** D-share 0..1 → red→purple→blue diverging color. 0.5 = neutral purple. */
function partyRampColor(shareD: number): string {
  // Solid R (#DC2626) → neutral (#9333EA) → Solid D (#2563EB)
  const r0 = [220, 38, 38]    // R
  const r1 = [147, 51, 234]   // purple midpoint
  const r2 = [37, 99, 235]    // D
  const t = Math.max(0, Math.min(1, shareD))
  const ramp = t < 0.5
    ? interp(r0, r1, t * 2)
    : interp(r1, r2, (t - 0.5) * 2)
  return `rgb(${ramp[0]}, ${ramp[1]}, ${ramp[2]})`
}

function interp(a: number[], b: number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

/** Discrete party color for district view */
function partyColor(p: 'D' | 'R' | 'I' | null): string {
  if (p === 'D') return '#2563EB'
  if (p === 'R') return '#DC2626'
  if (p === 'I') return '#7C3AED'
  return '#CBD5E1' // vacant / unknown
}

// ── Topology types ───────────────────────────────────────────────────────────

interface StateFeature extends Feature<Geometry, { name?: string }> {
  id: string
}

interface DistrictFeature extends Feature<Geometry, {
  // Lewis dataset uses lowercase keys (statefp, district, statename).
  // Census-derived TopoJSONs use uppercase (STATEFP, CD119FP / CD118FP).
  // We accept either so the file format can change without code changes.
  statefp?: string
  district?: number | string
  STATEFP?: string
  CD119FP?: string
  CD118FP?: string
  NAMELSAD?: string
}> {
  id: string
}

// ── Component ────────────────────────────────────────────────────────────────

type View = 'state' | 'district'

export default function USPartyMap() {
  const router = useRouter()
  const [view, setView] = useState<View>('state')
  const [makeup, setMakeup] = useState<PartyMakeup | null>(null)
  const [stateFeatures, setStateFeatures] = useState<StateFeature[] | null>(null)
  const [districtFeatures, setDistrictFeatures] = useState<DistrictFeature[] | null>(null)
  const [districtError, setDistrictError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  // Always fetch party data + state topology on mount
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/representatives/party-makeup').then(r => r.ok ? r.json() : null),
      fetch(STATE_TOPO_URL).then(r => r.ok ? r.json() : null),
    ]).then(([m, topo]) => {
      if (cancelled) return
      if (m) setMakeup(m)
      if (topo?.objects?.states) {
        const geo = feature(topo, topo.objects.states) as unknown as FeatureCollection<Geometry, { name?: string }>
        setStateFeatures(geo.features as StateFeature[])
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Lazy-load district geometry only when user toggles to district view
  useEffect(() => {
    if (view !== 'district' || districtFeatures || districtError) return
    let cancelled = false
    fetch(DISTRICT_GEO_URL)
      .then(async r => {
        if (!r.ok) throw new Error('District boundary file not found')
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        // Accept either a plain GeoJSON FeatureCollection OR a TopoJSON object
        let collection: FeatureCollection<Geometry, any>
        if (data?.type === 'FeatureCollection') {
          collection = data
        } else if (data?.type === 'Topology' && data?.objects) {
          const objKey =
            data.objects.districts ? 'districts'
            : data.objects.cd119    ? 'cd119'
            : data.objects.cd118    ? 'cd118'
            : Object.keys(data.objects)[0]
          if (!objKey) throw new Error('TopoJSON has no "objects" key')
          collection = feature(data, data.objects[objKey]) as unknown as FeatureCollection<Geometry, any>
        } else {
          throw new Error('Unrecognized district geometry format')
        }
        setDistrictFeatures(collection.features as DistrictFeature[])
      })
      .catch((e) => !cancelled && setDistrictError(e.message))
    return () => { cancelled = true }
  }, [view, districtFeatures, districtError])

  // ── Render state view ─────────────────────────────────────────────────────
  const statePaths = useMemo(() => {
    if (!stateFeatures) return []
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: stateFeatures } as FeatureCollection)
    const pathGen = geoPath(projection)
    const out: Array<{ code: string; d: string }> = []
    for (const f of stateFeatures) {
      const code = FIPS_TO_STATE[String(f.id).padStart(2, '0')]
      if (!code) continue
      const d = pathGen(f as any)
      if (d) out.push({ code, d })
    }
    return out
  }, [stateFeatures])

  // ── Render district view ──────────────────────────────────────────────────
  // Build a Map for quick district→rep lookup
  const districtLookup = useMemo(() => {
    if (!makeup) return new Map<string, DistrictRow>()
    const m = new Map<string, DistrictRow>()
    for (const d of makeup.districts) {
      m.set(`${d.state}-${d.district}`, d)
    }
    return m
  }, [makeup])

  const districtPaths = useMemo(() => {
    if (!districtFeatures) return []
    const projection = geoAlbersUsa().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: districtFeatures } as FeatureCollection)
    const pathGen = geoPath(projection)
    const out: Array<{ key: string; state: string; district: string; d: string }> = []
    for (const f of districtFeatures) {
      const props = f.properties || {}
      const stateFips = String(props.statefp || props.STATEFP || '').padStart(2, '0')
      // Lewis dataset stores district as a number (0 = at-large). Census files use 'CD119FP'.
      const rawDist = props.district ?? props.CD119FP ?? props.CD118FP ?? ''
      const cd = String(typeof rawDist === 'number' ? Math.trunc(rawDist) : rawDist).padStart(2, '0')
      const stateCode = FIPS_TO_STATE[stateFips]
      if (!stateCode) continue
      const path = pathGen(f as any)
      if (!path) continue
      out.push({ key: `${stateCode}-${cd}`, state: stateCode, district: cd, d: path })
    }
    return out
  }, [districtFeatures])

  const loading = !makeup || !stateFeatures
  const hoveredState  = view === 'state'    ? hovered : null
  const hoveredDist   = view === 'district' ? hovered : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2 flex-wrap">
        <MapIcon className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">Party makeup</h3>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-[--border] bg-[--surface] overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setView('state')}
            className={`px-3 py-1 transition-colors ${
              view === 'state'
                ? 'bg-[--accent] text-white'
                : 'text-[--text-secondary] hover:bg-[--surface-secondary]'
            }`}
          >
            By state
          </button>
          <button
            onClick={() => setView('district')}
            className={`px-3 py-1 border-l border-[--border] transition-colors ${
              view === 'district'
                ? 'bg-[--accent] text-white'
                : 'text-[--text-secondary] hover:bg-[--surface-secondary]'
            }`}
          >
            By district
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-10 flex items-center justify-center" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxHeight: 360 }}>
            <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-auto"
              style={{ maxHeight: 360 }}
              aria-label={view === 'state' ? 'US map colored by House delegation makeup' : 'US map colored by district representative party'}
            >
              {view === 'state' && statePaths.map(({ code, d }) => {
                const entry = makeup!.states[code]
                const fill = entry ? partyRampColor(entry.houseShareD) : '#CBD5E1'
                const isHovered = hoveredState === code
                return (
                  <path
                    key={code}
                    d={d}
                    fill={fill}
                    stroke="var(--surface)"
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    onMouseEnter={() => setHovered(code)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => router.push(`/states/${code}`)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 100ms' }}
                  >
                    <title>{STATE_NAMES[code]}</title>
                  </path>
                )
              })}

              {view === 'district' && districtPaths.map(({ key, state, district, d }) => {
                const rep = districtLookup.get(`${state}-${district}`)
                  ?? districtLookup.get(`${state}-00`) // at-large fallback
                const fill = partyColor(rep?.party ?? null)
                const isHovered = hoveredDist === key
                return (
                  <path
                    key={key}
                    d={d}
                    fill={fill}
                    stroke="var(--surface)"
                    strokeWidth={isHovered ? 1.2 : 0.3}
                    opacity={rep ? 1 : 0.6}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => rep && router.push(`/scorecards/${rep.bioguideId}`)}
                    style={{ cursor: rep ? 'pointer' : 'default', transition: 'stroke-width 80ms' }}
                  >
                    <title>
                      {rep
                        ? `${rep.fullName} (${rep.party}) — ${state}-${district}`
                        : `${state} district ${district} — vacant or unmatched`}
                    </title>
                  </path>
                )
              })}
            </svg>

            {/* Hovered breakdown */}
            <div className="min-h-[40px] mt-1 text-center px-2">
              {view === 'state' && hoveredState && makeup!.states[hoveredState] && (() => {
                const s = makeup!.states[hoveredState]
                return (
                  <p className="text-xs">
                    <span className="font-bold text-[--text]">{STATE_NAMES[hoveredState]}</span>
                    <span className="text-[--text-muted] block mt-0.5">
                      House:{' '}
                      <span className="text-blue-600 font-semibold">{s.house.D}D</span>
                      {' / '}
                      <span className="text-red-600 font-semibold">{s.house.R}R</span>
                      {s.house.I > 0 && <> / <span className="text-purple-600 font-semibold">{s.house.I}I</span></>}
                      {' · Senate: '}
                      <span className="text-blue-600 font-semibold">{s.senate.D}D</span>
                      {' / '}
                      <span className="text-red-600 font-semibold">{s.senate.R}R</span>
                      {s.senate.I > 0 && <> / <span className="text-purple-600 font-semibold">{s.senate.I}I</span></>}
                    </span>
                  </p>
                )
              })()}

              {view === 'district' && hoveredDist && (() => {
                const [st, di] = hoveredDist.split('-')
                const rep = districtLookup.get(`${st}-${di}`) ?? districtLookup.get(`${st}-00`)
                if (!rep) return (
                  <p className="text-xs text-[--text-muted]">{st} district {di} — vacant or unmatched</p>
                )
                return (
                  <p className="text-xs">
                    <span className="font-bold text-[--text]">{rep.fullName}</span>
                    <span className="text-[--text-muted]"> · {st}-{di} · </span>
                    <span className={`font-semibold ${rep.party === 'D' ? 'text-blue-600' : rep.party === 'R' ? 'text-red-600' : 'text-purple-600'}`}>
                      {rep.party === 'D' ? 'Democrat' : rep.party === 'R' ? 'Republican' : 'Independent'}
                    </span>
                  </p>
                )
              })()}

              {!hovered && (
                <p className="text-[11px] text-[--text-muted] flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" />
                  {view === 'state' ? 'Hover a state for delegation breakdown' : 'Hover a district to see its representative'}
                </p>
              )}
            </div>

            {/* District view: graceful fallback when geometry isn't loaded yet */}
            {view === 'district' && !districtFeatures && (
              <div className="mt-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <Users className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-amber-900 mb-1">
                  {districtError ? 'District boundary data not loaded yet' : 'Loading district boundaries…'}
                </p>
                {districtError && (
                  <p className="text-[11px] text-amber-700">
                    Run <code className="font-mono">python3 scripts/build-district-geo.py</code> to
                    regenerate the boundary file at{' '}
                    <code className="font-mono">/public/data/us-cd-119.geojson</code>.
                  </p>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-[--text-muted]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2.5 rounded-sm" style={{ background: '#2563EB' }} />
                Democrat
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2.5 rounded-sm" style={{ background: '#7C3AED' }} />
                Independent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2.5 rounded-sm" style={{ background: '#DC2626' }} />
                Republican
              </span>
              {view === 'state' && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="w-12 h-2 rounded" style={{
                    background: 'linear-gradient(to right, #DC2626, #9333EA, #2563EB)',
                  }} />
                  state delegation lean
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
