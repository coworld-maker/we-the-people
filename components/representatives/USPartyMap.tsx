'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { Map as MapIcon, Info } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const WIDTH = 960
const HEIGHT = 600
const STATE_TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

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

interface PartyMakeup {
  states: Record<string, StateEntry>
}

// ── Color helpers ────────────────────────────────────────────────────────────

/**
 * Discrete party color, following the convention of Wikipedia / NYT /
 * 270toWin election maps:
 *   - Solid red / blue when a delegation is unified or has a clear majority
 *   - Lighter shades when the majority is slim
 *   - Purple only when an Independent caucus is meaningfully represented
 *     (≥20 % of the delegation)
 *   - Gray when there's a true tie or no data
 */
function partyColorFor(entry: {
  house: { D: number; R: number; I: number; total: number }
}): string {
  const { D, R, I, total } = entry.house
  if (total === 0) return '#CBD5E1' // slate-300 — no data
  const iShare = I / total
  const dShare = D / total
  const rShare = R / total

  // Independent matters (Bernie / King / etc level — ≥20 % of state's House delegation)
  if (iShare >= 0.2) {
    if (dShare > rShare) return '#6D6AC4' // purple-blue (lean-D with strong I)
    if (rShare > dShare) return '#A14965' // purple-red (lean-R with strong I)
    return '#7C3AED'                       // pure purple
  }

  // Clear majorities — discrete tiers, not a continuous ramp
  if (dShare === 1)      return '#1E3A8A' // solid deep blue — pure D
  if (dShare >= 0.65)    return '#2563EB' // standard blue
  if (dShare > 0.5)      return '#60A5FA' // light blue — slim D majority
  if (rShare === 1)      return '#7F1D1D' // solid deep red — pure R
  if (rShare >= 0.65)    return '#DC2626' // standard red
  if (rShare > 0.5)      return '#F87171' // light red — slim R majority

  return '#94A3B8' // slate-400 — tied delegation
}

// ── Topology types ───────────────────────────────────────────────────────────

interface StateFeature extends Feature<Geometry, { name?: string }> {
  id: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function USPartyMap() {
  const router = useRouter()
  const [makeup, setMakeup] = useState<PartyMakeup | null>(null)
  const [stateFeatures, setStateFeatures] = useState<StateFeature[] | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

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

  // Fixed projection (no fitSize) — proven robust for US maps with outlier
  // coords. scale 1280 fills a 960×600 viewBox; upward translate bias leaves
  // room for AK / HI insets at the bottom.
  const projection = useMemo(
    () => geoAlbersUsa().scale(1280).translate([WIDTH / 2, HEIGHT / 2 - 30]),
    [],
  )
  const pathGen = useMemo(() => geoPath(projection), [projection])

  const statePaths = useMemo(() => {
    if (!stateFeatures) return []
    const out: Array<{ code: string; d: string }> = []
    for (const f of stateFeatures) {
      const code = FIPS_TO_STATE[String(f.id).padStart(2, '0')]
      if (!code) continue
      const d = pathGen(f as any)
      if (d) out.push({ code, d })
    }
    return out
  }, [stateFeatures, pathGen])

  const loading = !makeup || !stateFeatures

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <MapIcon className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">Party makeup by state</h3>
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
              aria-label="US map colored by House delegation makeup"
            >
              {statePaths.map(({ code, d }) => {
                const entry = makeup!.states[code]
                const fill = entry ? partyColorFor(entry) : '#CBD5E1'
                const isHovered = hovered === code
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
            </svg>

            {/* Hovered breakdown */}
            <div className="min-h-[40px] mt-1 text-center px-2">
              {hovered && makeup!.states[hovered] ? (() => {
                const s = makeup!.states[hovered]
                return (
                  <p className="text-xs">
                    <span className="font-bold text-[--text]">{STATE_NAMES[hovered]}</span>
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
              })() : (
                <p className="text-[11px] text-[--text-muted] flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" /> Hover a state for delegation breakdown
                </p>
              )}
            </div>

            {/* Legend — discrete tiers, two rows */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-[10px] text-[--text-muted] flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#1E3A8A' }} />
                  All D
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#2563EB' }} />
                  D majority
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#60A5FA' }} />
                  Slim D
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#94A3B8' }} />
                  Tied
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#F87171' }} />
                  Slim R
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#DC2626' }} />
                  R majority
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2.5 rounded-sm" style={{ background: '#7F1D1D' }} />
                  All R
                </span>
              </div>
              <p className="text-center text-[10px] text-[--text-muted]">
                Purple shades appear only where Independents hold ≥20% of a delegation.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
